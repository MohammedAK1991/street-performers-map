import { Router, type IRouter } from 'express';
import { PerformanceController } from '@/domains/performance/controllers/PerformanceController';
import { authenticate, authorize } from '@/shared/middleware/auth';

const router: IRouter = Router();
const performanceController = new PerformanceController();

// Public routes
router.get('/nearby', performanceController.getNearbyPerformances);
router.get('/:id', performanceController.getPerformance);

// Protected routes (authenticated users)
router.post('/:id/like', authenticate, performanceController.likePerformance);

// Performer-only routes
router.post('/', authenticate, authorize(['performer']), performanceController.createPerformance);
router.get('/my/performances', authenticate, authorize(['performer']), performanceController.getMyPerformances);
router.put('/:id', authenticate, authorize(['performer']), performanceController.updatePerformance);
router.delete('/:id', authenticate, authorize(['performer']), performanceController.deletePerformance);
router.post('/:id/start', authenticate, authorize(['performer']), performanceController.startPerformance);
router.post('/:id/end', authenticate, authorize(['performer']), performanceController.endPerformance);

export { router as performanceRoutes };
