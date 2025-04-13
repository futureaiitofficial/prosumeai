import express from 'express';
import serverStatusRouter from './server-status';

const router = express.Router();

// Mount all admin routes without adding the '/admin' prefix again
// since we'll be mounted at /api/admin already
router.use(serverStatusRouter);

// Add other admin routes here as they are created
// Example: router.use(someOtherAdminRouter);

export default router; 