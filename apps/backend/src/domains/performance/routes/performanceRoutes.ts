import { PerformanceController } from "@/domains/performance/controllers/PerformanceController";
import { analyticsController } from "@/domains/performance/controllers/AnalyticsController";
import { authenticate } from "@/shared/middleware/auth";
import { type IRouter, Router } from "express";

const router: IRouter = Router();
const performanceController = new PerformanceController();

// Public routes
router.get("/nearby", performanceController.getNearbyPerformances);
router.get("/:id", performanceController.getPerformance);

// Protected routes (authenticated users)
router.post(
	"/:id/like",
	authenticate,
	performanceController.toggleLikePerformance,
);
router.post(
	"/:id/like-toggle",
	authenticate,
	performanceController.toggleLikePerformance,
);

// Performer-only routes (temporarily allowing all authenticated users)
router.post("/", authenticate, performanceController.createPerformance);
router.get(
	"/my/performances",
	authenticate,
	performanceController.getMyPerformances,
);
router.put("/:id", authenticate, performanceController.updatePerformance);
router.delete("/:id", authenticate, performanceController.deletePerformance);
router.post("/:id/start", authenticate, performanceController.startPerformance);
router.post("/:id/end", authenticate, performanceController.endPerformance);

// Analytics routes (performer-only)
router.get("/analytics", authenticate, analyticsController.getPerformerAnalytics);
router.get("/:id/analytics", authenticate, analyticsController.getPerformanceAnalytics);
router.get("/:id/metrics/live", authenticate, analyticsController.getLiveMetrics);

export { router as performanceRoutes };
