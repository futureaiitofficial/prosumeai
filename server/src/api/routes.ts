import { Express, Request, Response, NextFunction } from "express";
import { requireUser } from "../../middleware/auth";

/**
 * Handle API errors consistently
 */
const handleApiError = (res: Response, error: any, message: string) => {
  const statusCode = error.statusCode || 500;
  const errorMessage = error.message || message;
  
  console.error(`API Error [${statusCode}]: ${message}`, error);
  
  return res.status(statusCode).json({
    error: true,
    message: errorMessage,
    code: error.code || 'INTERNAL_SERVER_ERROR'
  });
};