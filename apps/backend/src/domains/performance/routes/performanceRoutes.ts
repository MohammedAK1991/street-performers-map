import { Router, type IRouter } from 'express';
import { PerformanceController } from '@/domains/performance/controllers/PerformanceController';
import { authenticate, authorize } from '@/shared/middleware/auth';

const router: IRouter = Router();
const performanceController = new PerformanceController();

// Public routes
router.get('/nearby', performanceController.getNearbyPerformances);
router.get('/:id', performanceController.getPerformance);

// Protected routes (authenticated users)
router.post('/:id/like', authenticate, performanceController.toggleLikePerformance);
router.post('/:id/like-toggle', authenticate, performanceController.toggleLikePerformance);

// Performer-only routes (temporarily allowing all authenticated users)
router.post('/', authenticate, performanceController.createPerformance);
router.get('/my/performances', authenticate, performanceController.getMyPerformances);
router.put('/:id', authenticate, performanceController.updatePerformance);
router.delete('/:id', authenticate, performanceController.deletePerformance);
router.post('/:id/start', authenticate, performanceController.startPerformance);
router.post('/:id/end', authenticate, performanceController.endPerformance);

export { router as performanceRoutes };
