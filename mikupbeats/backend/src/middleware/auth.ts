import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser { id: string; email: string; display_name: string | null; is_admin: boolean; }

declare global { namespace Express { interface Request { user?: AuthUser; } } }

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try { req.user = jwt.verify(token, SECRET) as AuthUser; next(); }
  catch { return res.status(401).json({ error: "Invalid token" }); }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user?.is_admin) return res.status(403).json({ error: "Admin only" });
    next();
  });
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, SECRET, { expiresIn: "30d" });
}

export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}
