import { type Router as ExpressRouter, Router } from "express";
import express from "express";
import { authenticate } from "../../../shared/middleware/auth";
import { paymentController } from "../controllers/PaymentController";

const router: ExpressRouter = Router();

// Public routes
router.get("/config", paymentController.getPaymentConfig);
router.get(
	"/performance/:id/summary",
	paymentController.getPerformancePaymentSummary,
);

// Webhook route (no auth required, verified by Stripe signature)
router.post("/webhooks/stripe", paymentController.handleStripeWebhook);

// Protected routes (require authentication)
router.post("/tip", authenticate, paymentController.createTip);
router.post("/confirm", authenticate, paymentController.confirmPayment);
router.get("/transactions/:id", authenticate, paymentController.getTransaction);
router.get("/earnings", authenticate, paymentController.getEarnings);

// Stripe Connect routes 
router.post("/connect/account", paymentController.createConnectAccount); // No auth - uses email lookup
router.get("/connect/account", authenticate, paymentController.getConnectAccount);
router.post("/connect/link", authenticate, paymentController.createAccountLink);

export { router as paymentRoutes };
