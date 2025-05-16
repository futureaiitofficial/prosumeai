import express from 'express';
import serverStatusRouter from './server-status';
import securityRouter from './security-routes';

const router = express.Router();

// Mount all admin routes without adding the '/admin' prefix again
// since we'll be mounted at /api/admin already
router.use(serverStatusRouter);

// Security routes for managing encryption, password policies, etc.
router.use('/security', securityRouter);

// Add other admin routes here as they are created
// Example: router.use(someOtherAdminRouter);

export default router; 