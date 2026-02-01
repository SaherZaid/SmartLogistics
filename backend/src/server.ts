import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";


import shipmentRoutes from "./routes/shipment.routes";
import authRoutes from "./routes/auth.routes";
import { requireAuth } from "./middleware/auth.middleware";


dotenv.config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);


// Debugging logs
console.log("authRoutes is", typeof authRoutes);
console.log("typeof requireAuth:", typeof requireAuth);
console.log("typeof shipmentRoutes:", typeof shipmentRoutes);


// Public
app.use("/api/auth", authRoutes);
app.get("/health", (_req, res) => res.json({ ok: true }));

// Protected
app.use("/api/shipments", requireAuth);
app.use("/api/shipments", shipmentRoutes);


mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => console.log("Connected to MongoDB Atlas 🎉"))
  .catch((err) => console.error("Mongo error:", err));

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
