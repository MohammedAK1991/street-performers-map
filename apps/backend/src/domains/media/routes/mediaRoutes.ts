import { type IRouter, Router } from "express";
import { authenticate } from "../../../shared/middleware/auth";
import { upload } from "../../../shared/services/cloudinary.service";
import { VideoController } from "../controllers/VideoController";

const router: IRouter = Router();
const videoController = new VideoController();

// Video upload routes (protected)
router.post(
	"/videos/upload",
	authenticate,
	upload.single("video"),
	videoController.uploadVideo,
);

// User video management routes (protected)
router.get("/videos/my-videos", authenticate, videoController.getUserVideos);
router.get("/videos/latest", authenticate, videoController.getLatestVideo);
router.get(
	"/videos/analytics",
	authenticate,
	videoController.getVideoAnalytics,
);
router.get(
	"/videos/upload-eligibility",
	authenticate,
	videoController.checkUploadEligibility,
);
router.delete("/videos/:videoId", authenticate, videoController.deleteVideo);
router.patch(
	"/videos/:videoId/link-performance",
	authenticate,
	videoController.linkVideoToPerformance,
);
router.post(
	"/videos/save-client-upload",
	authenticate,
	videoController.saveClientUpload,
);

// Public video routes
router.get("/videos/:videoId", videoController.getVideo);
router.get(
	"/performances/:performanceId/videos",
	videoController.getPerformanceVideos,
);
router.post("/videos/:videoId/view", videoController.recordView);
router.post("/videos/:videoId/watch-time", videoController.recordWatchTime);

// Admin/Moderation routes (would need admin middleware in production)
router.get("/admin/videos/moderation", videoController.getVideosForModeration);
router.post("/admin/videos/:videoId/approve", videoController.approveVideo);
router.post("/admin/videos/:videoId/reject", videoController.rejectVideo);

// Health check
router.get("/health", (req, res) => {
	res.json({
		success: true,
		data: { service: "Media API", status: "healthy" },
		meta: { timestamp: new Date().toISOString() },
	});
});

export { router as mediaRoutes };
