import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check if the user is an admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated and has admin flag
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Check if user is an admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied: Admin privileges required" });
  }
  
  // User is an admin, proceed
  next();
} 