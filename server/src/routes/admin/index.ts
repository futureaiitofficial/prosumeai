import express from 'express';
import serverStatusRouter from './server-status';
import securityRouter from './security-routes';
import { registerSmtpRoutes } from './smtp-routes';

const router = express.Router();

// Mount all admin routes without adding the '/admin' prefix again
// since we'll be mounted at /api/admin already
router.use(serverStatusRouter);

// Security routes for managing encryption, password policies, etc.
router.use('/security', securityRouter);

// Create SMTP routes directly on the app
// This will be handled in the admin-routes.ts file
// by passing the app instance to registerSmtpRoutes

// Add other admin routes here as they are created
// Example: router.use(someOtherAdminRouter);

export default router; 