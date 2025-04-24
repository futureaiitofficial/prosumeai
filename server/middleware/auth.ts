import { Request, Response, NextFunction } from "express";

/**
 * Middleware to require user authentication for a route
 * Checks if the user is authenticated
 */
export const requireUser = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated
  // First check if the passport function exists, then check if the user is authenticated
  if ((!req.isAuthenticated || !req.isAuthenticated()) || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // User is authenticated
  next();
};

/**
 * Middleware to require admin authentication for a route
 * Checks if the user is authenticated and is an admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated
  if ((!req.isAuthenticated || !req.isAuthenticated()) || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Check if user is admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  // User is authenticated and is admin
  next();
}; 