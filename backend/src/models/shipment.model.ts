import { Schema, model, Types } from "mongoose";

export type ShipmentStatus = "Pending" | "InTransit" | "Delivered";

export interface ShipmentDoc {
  userId: Types.ObjectId;       // لاحقاً من JWT
  trackingNumber: string;
  customerName: string;
  status: ShipmentStatus;
  currentLocation: string;
  eta: Date;
  createdAt: Date;
  updatedAt: Date;
}

const shipmentSchema = new Schema<ShipmentDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    trackingNumber: { type: String, required: true, trim: true, index: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "InTransit", "Delivered"],
      index: true,
      default: "Pending",
    },
    currentLocation: { type: String, required: true, trim: true },
    eta: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Shipment = model<ShipmentDoc>("Shipment", shipmentSchema);
