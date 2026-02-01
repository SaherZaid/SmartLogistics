import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = { userId: string; email: string };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  const token = header.substring("Bearer ".length);

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: "JWT_SECRET is not set" });

    const payload = jwt.verify(token, secret) as JwtPayload;
    (req as any).user = payload;

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
