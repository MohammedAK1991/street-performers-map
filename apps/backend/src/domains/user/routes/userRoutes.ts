import { Router, type IRouter } from 'express';
import { UserController } from '@/domains/user/controllers/UserController';
import { authenticate, optionalAuth } from '@/shared/middleware/auth';

const router: IRouter = Router();
const userController = new UserController();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/sync-clerk', userController.syncClerkUser);

// Protected routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/location', authenticate, userController.updateLocation);

// Public/optional auth routes
router.get('/nearby-performers', optionalAuth, userController.getNearbyPerformers);

export { router as userRoutes };
