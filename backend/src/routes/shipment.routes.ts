import { Router } from "express";
import {
  createShipment,
  listShipments,
  updateShipmentStatus,
  deleteShipment,
  shipmentStats,
  getShipmentById,
} from "../controllers/shipment.controller";

const router = Router();

// ✅ fixed routes first
router.get("/stats", shipmentStats);

// CRUD
router.get("/", listShipments);
router.post("/", createShipment);

// ✅ by id
router.get("/:id", getShipmentById);

router.patch("/:id/status", updateShipmentStatus);
router.delete("/:id", deleteShipment);

export default router;
