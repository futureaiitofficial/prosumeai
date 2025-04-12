import { Request, Response, NextFunction } from "express";

/**
 * Middleware to restrict access to admin users only
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated
  if (!req.isAuthenticated()) {
    console.error('Admin check failed: User not authenticated');
    return res.status(401).json({ 
      message: "Authentication required",
      error: "NOT_AUTHENTICATED" 
    });
  }
  
  // Check if user has req.user object
  if (!req.user) {
    console.error('Admin check failed: No user object found');
    return res.status(401).json({ 
      message: "User session invalid",
      error: "NO_USER_OBJECT" 
    });
  }
  
  // Check if user is an admin
  if (!req.user.isAdmin) {
    console.error(`Admin check failed: User ${req.user.username} (ID: ${req.user.id}) is not an admin`);
    return res.status(403).json({ 
      message: "Admin access required",
      error: "NOT_ADMIN" 
    });
  }
  
  // Add debug logging
  console.log(`Admin access granted: ${req.user.username} (ID: ${req.user.id}) accessing ${req.method} ${req.path}`);
  
  // User is authenticated and is an admin, proceed
  next();
}