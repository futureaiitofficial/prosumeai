import { Request, Response, NextFunction } from "express";

/**
 * Middleware to require user authentication for a route
 * Checks if the user is authenticated
 */
export const requireUser = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // User is authenticated
  next();
}; 