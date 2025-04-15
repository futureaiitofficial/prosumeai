import { Request, Response, NextFunction } from "express";

/**
 * Middleware to require admin privileges for a route
 * Checks if the user is authenticated and has admin privileges
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Check if user has admin privileges
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  
  // User is authenticated and has admin privileges
  next();
}; 