import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface AuthenticatedRequest extends Request {
  user?: User;
  tenantId?: string;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function verifyToken(token: string): { userId: string; email: string; role: string; tenantId: string | null } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string; tenantId: string | null };
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Nicht authentifiziert" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ message: "Ungültiger Token" });
  }

  req.user = {
    id: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    tenantId: decoded.tenantId,
  } as User;
  
  req.tenantId = decoded.tenantId || undefined;
  
  next();
}

export function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Keine Berechtigung" });
  }
  next();
}

export function agentMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin" && req.user?.role !== "agent") {
    return res.status(403).json({ message: "Keine Berechtigung" });
  }
  next();
}
