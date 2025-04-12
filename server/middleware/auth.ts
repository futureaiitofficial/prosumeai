import { Request, Response, NextFunction } from "express";

/**
 * Middleware to restrict access to authenticated users only
 */
export function requireUser(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // User is authenticated, proceed
  next();
} 