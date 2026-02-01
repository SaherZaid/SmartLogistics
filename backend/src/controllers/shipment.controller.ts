import { Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Shipment } from "../models/shipment.model";

type ShipmentStatus = "Pending" | "InTransit" | "Delivered";

// ✅ trackingNumber صار Optional (بنولده تلقائيًا إذا ما جا من الفرونت)
const createShipmentSchema = z.object({
  trackingNumber: z.string().min(3).max(50).optional(),
  customerName: z.string().min(2).max(80),
  status: z.enum(["Pending", "InTransit", "Delivered"]).optional(),
  currentLocation: z.string().min(2).max(80),
  eta: z.string().datetime(),
});

const updateStatusSchema = z.object({
  status: z.enum(["Pending", "InTransit", "Delivered"]),
});

function getUserId(req: Request): string {
  return (req as any).user.userId as string; // هذا لازم يكون Mongo _id string
}

function getUserObjectId(req: Request): mongoose.Types.ObjectId {
  const userId = getUserId(req);

  if (!mongoose.isValidObjectId(userId)) {
    // لو صار خطأ في JWT/requireAuth
    throw new Error("Invalid user id in token");
  }

  return new mongoose.Types.ObjectId(userId);
}

// ✅ يولد Tracking Number تلقائيًا
function generateTrackingNumber() {
  // مثال: TRK-9F2KQ7
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TRK-${rand}`;
}

export async function createShipment(req: Request, res: Response) {
  const userObjectId = getUserObjectId(req);

  const parsed = createShipmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() });
  }

  // ✅ لو ما أرسل trackingNumber، ولده هنا
  let trackingNumber = parsed.data.trackingNumber?.trim();
  if (!trackingNumber) trackingNumber = generateTrackingNumber();

  // ✅ ضمان uniqueness (نجرب كم مرة لو صار تصادم نادر)
  for (let i = 0; i < 5; i++) {
    const exists = await Shipment.findOne({ trackingNumber });
    if (!exists) break;
    trackingNumber = generateTrackingNumber();
  }

  const shipment = await Shipment.create({
    userId: userObjectId,
    trackingNumber,
    customerName: parsed.data.customerName.trim(),
    status: parsed.data.status ?? "Pending",
    currentLocation: parsed.data.currentLocation.trim(),
    eta: new Date(parsed.data.eta),
  });

  return res.status(201).json(shipment);
}

export async function listShipments(req: Request, res: Response) {
  const userObjectId = getUserObjectId(req);

  const page = Math.max(Number(req.query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 10), 1), 50);

  const status = req.query.status as string | undefined;
  const q = (req.query.q as string | undefined)?.trim();

  const filter: any = { userId: userObjectId };

  if (status && (["Pending", "InTransit", "Delivered"] as ShipmentStatus[]).includes(status as ShipmentStatus)) {
    filter.status = status;
  }

  if (q) {
    filter.$or = [
      { trackingNumber: { $regex: q, $options: "i" } },
      { customerName: { $regex: q, $options: "i" } },
      { currentLocation: { $regex: q, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Shipment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Shipment.countDocuments(filter),
  ]);

  return res.json({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getShipmentById(req: Request, res: Response) {
  const userObjectId = getUserObjectId(req);
  const id = req.params.id;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid shipment id" });
  }

  const shipment = await Shipment.findOne({ _id: id, userId: userObjectId });
  if (!shipment) return res.status(404).json({ message: "Shipment not found" });

  return res.json(shipment);
}

export async function updateShipmentStatus(req: Request, res: Response) {
  const userObjectId = getUserObjectId(req);
  const id = req.params.id;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid shipment id" });
  }

  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() });
  }

  const updated = await Shipment.findOneAndUpdate(
    { _id: id, userId: userObjectId },
    { status: parsed.data.status },
    { new: true }
  );

  if (!updated) return res.status(404).json({ message: "Shipment not found" });
  return res.json(updated);
}

export async function deleteShipment(req: Request, res: Response) {
  const userObjectId = getUserObjectId(req);
  const id = req.params.id;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid shipment id" });
  }

  const deleted = await Shipment.findOneAndDelete({ _id: id, userId: userObjectId });
  if (!deleted) return res.status(404).json({ message: "Shipment not found" });

  return res.status(204).send();
}

export async function shipmentStats(req: Request, res: Response) {
  const userObjectId = getUserObjectId(req);

  // ✅ هنا السبب: لازم match على ObjectId (مو string)
  const result = await Shipment.aggregate([
    { $match: { userId: userObjectId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const stats: Record<string, number> = { Pending: 0, InTransit: 0, Delivered: 0 };
  for (const row of result) stats[row._id] = row.count;

  return res.json(stats);
}
