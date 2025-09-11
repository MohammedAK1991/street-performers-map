import type { Request, Response } from "express";
import { ApiError } from "../../../shared/utils/errors";
import { logger } from "../../../shared/utils/logger";
import {
	type CreateTipRequest,
	paymentService,
} from "../services/PaymentService";
import { stripeService } from "../services/StripeService";
import { UserModel } from "../../user/entities/User";

export class PaymentController {
	/**
	 * Create a tip payment intent
	 * POST /api/payments/tip
	 */
	async createTip(req: Request, res: Response): Promise<void> {
		try {
			const { amount, performanceId, performerId, isAnonymous, publicMessage } =
				req.body;
			const userId = req.user?.userId; // From auth middleware

			// Validate required fields
			if (!amount || !performanceId || !performerId) {
				throw new ApiError(
					400,
					"Missing required fields: amount, performanceId, performerId",
				);
			}

			// Validate amount
			const numAmount = Number(amount);
			if (Number.isNaN(numAmount) || numAmount < 0.5 || numAmount > 100) {
				throw new ApiError(400, "Amount must be between €0.50 and €100.00");
			}

			// Extract location from request headers or IP (optional)
			const location = {
				coordinates: [0, 0] as [number, number], // TODO: Get from IP geolocation
				city: (req.headers["cf-ipcity"] as string) || undefined,
				country: (req.headers["cf-ipcountry"] as string) || undefined,
			};

			const createTipRequest: CreateTipRequest = {
				amount: numAmount,
				performanceId,
				performerId,
				tipperId: userId, // Always store the tipper ID for transaction tracking
				isAnonymous: Boolean(isAnonymous),
				publicMessage,
				currency: "EUR",
				location,
			};

			const result = await paymentService.createTip(createTipRequest);

			res.status(201).json({
				success: true,
				data: result,
			});
		} catch (error: any) {
			logger.error("❌ Create tip error:", error);

			if (error instanceof ApiError) {
				res.status(error.statusCode).json({
					success: false,
					error: {
						message: error.message,
						code: error.code,
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: {
						message: "Internal server error",
					},
				});
			}
		}
	}

	/**
	 * Get transaction details
	 * GET /api/payments/transactions/:id
	 */
	async getTransaction(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const userId = req.user?.userId;

			const transaction = await paymentService.getTransaction(id);

			if (!transaction) {
				throw new ApiError(404, "Transaction not found");
			}

			// Check permissions (user can only see their own transactions)
			if (
				transaction.fromUserId !== userId &&
				transaction.toUserId !== userId
			) {
				throw new ApiError(403, "Access denied");
			}

			res.json({
				success: true,
				data: transaction,
			});
		} catch (error: any) {
			logger.error("❌ Get transaction error:", error);

			if (error instanceof ApiError) {
				res.status(error.statusCode).json({
					success: false,
					error: {
						message: error.message,
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: {
						message: "Internal server error",
					},
				});
			}
		}
	}

	/**
	 * Confirm payment (for test mode)
	 * POST /api/payments/confirm
	 */
	async confirmPayment(req: Request, res: Response): Promise<void> {
		try {
			const { paymentIntentId } = req.body;

			if (!paymentIntentId) {
				throw new ApiError(400, "Payment intent ID is required");
			}

			// Update transaction status to completed
			await paymentService.updateTransactionStatus(
				paymentIntentId,
				"completed",
				`test_charge_${Date.now()}`, // Mock charge ID for test mode
			);

			res.json({
				success: true,
				message: "Payment confirmed successfully",
			});
		} catch (error: any) {
			logger.error("❌ Confirm payment error:", error);

			if (error instanceof ApiError) {
				res.status(error.statusCode).json({
					success: false,
					error: {
						message: error.message,
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: {
						message: "Internal server error",
					},
				});
			}
		}
	}

	/**
	 * Get performer earnings
	 * GET /api/payments/earnings
	 */
	async getEarnings(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user?.userId;
			const { startDate, endDate } = req.query;

			if (!userId) {
				throw new ApiError(401, "Authentication required");
			}

			const start = startDate ? new Date(startDate as string) : undefined;
			const end = endDate ? new Date(endDate as string) : undefined;

			const earnings = await paymentService.getPerformerEarnings(
				userId,
				start,
				end,
			);
			const transactions = await paymentService.getPerformerTransactions(
				userId,
				"completed",
			);

			res.json({
				success: true,
				data: {
					earnings,
					transactions,
				},
			});
		} catch (error: any) {
			logger.error("❌ Get earnings error:", error);

			if (error instanceof ApiError) {
				res.status(error.statusCode).json({
					success: false,
					error: {
						message: error.message,
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: {
						message: "Internal server error",
					},
				});
			}
		}
	}

	/**
	 * Get performance payment summary
	 * GET /api/payments/performance/:id/summary
	 */
	async getPerformancePaymentSummary(
		req: Request,
		res: Response,
	): Promise<void> {
		try {
			const { id } = req.params;

			const summary = await paymentService.getPerformancePaymentSummary(id);
			const recentTips = await paymentService.getRecentPublicTips(id, 5);

			res.json({
				success: true,
				data: {
					summary,
					recentTips,
				},
			});
		} catch (error: any) {
			logger.error("❌ Get performance payment summary error:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}

	/**
	 * Handle Stripe webhooks
	 * POST /api/payments/webhooks/stripe
	 */
	async handleStripeWebhook(req: Request, res: Response): Promise<void> {
		try {
			const signature = req.headers["stripe-signature"] as string;

			if (!signature) {
				throw new ApiError(400, "Missing Stripe signature");
			}

			// Handle the webhook event
			await stripeService.handleWebhookEvent(req.body, signature);

			res.json({ received: true });
		} catch (error: any) {
			logger.error("❌ Stripe webhook error:", error);
			res.status(400).json({
				success: false,
				error: {
					message: error.message,
				},
			});
		}
	}

	/**
	 * Get payment configuration (for frontend)
	 * GET /api/payments/config
	 */
	async getPaymentConfig(req: Request, res: Response): Promise<void> {
		try {
			const country = (req.headers["cf-ipcountry"] as string) || "ES";

			const config = {
				currency: "EUR",
				paymentMethods: stripeService.getPaymentMethodTypes(country),
				isConfigured: stripeService.isConfigured(),
				minAmount: 0.5,
				maxAmount: 100,
				suggestedAmounts: [1, 3, 5, 10],
			};

			res.json({
				success: true,
				data: config,
			});
		} catch (error: any) {
			logger.error("❌ Get payment config error:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	}

	/**
	 * Create Stripe Connect account for performer
	 * POST /api/payments/connect/account
	 */
	async createConnectAccount(req: Request, res: Response): Promise<void> {
		try {
			const { email, country, businessType } = req.body;

			if (!email || !country) {
				throw new ApiError(400, "Email and country are required");
			}

			// Find user by email instead of using JWT token
			const normalizedEmail = email.toLowerCase().trim();
			logger.info(`🔍 Looking for user with email: "${normalizedEmail}"`);
			
			const user = await UserModel.findOne({ email: normalizedEmail });
			if (!user) {
				// Let's also try to find any user with similar email for debugging
				const similarUsers = await UserModel.find({ 
					email: { $regex: email.split('@')[0], $options: 'i' } 
				}).select('email').limit(5);
				
				logger.error(`❌ User not found with email: "${normalizedEmail}"`, {
					searchedEmail: normalizedEmail,
					similarEmails: similarUsers.map(u => u.email)
				});
				
				throw new ApiError(404, `User not found with email: ${email}`);
			}
			
			logger.info(`✅ Found user: ${user._id} with email: ${user.email}`);

			if (user.stripe?.connectAccountId) {
				throw new ApiError(400, "User already has a Connect account");
			}

			const connectAccount = await stripeService.createConnectAccount({
				performerId: user._id.toString(),
				email,
				country,
				businessType: businessType || 'individual'
			});

			// Save Connect account ID to user profile in database
			await UserModel.findByIdAndUpdate(user._id, {
				$set: {
					'stripe.connectAccountId': connectAccount.accountId,
					'stripe.accountStatus': 'pending',
					'stripe.detailsSubmitted': connectAccount.detailsSubmitted,
					'stripe.chargesEnabled': connectAccount.chargesEnabled,
					'stripe.payoutsEnabled': connectAccount.payoutsEnabled,
					'stripe.onboardingUrl': connectAccount.loginUrl,
				}
			});

			logger.info(`✅ Saved Stripe Connect account ${connectAccount.accountId} for user ${user._id} (${email})`);

			res.json({
				success: true,
				data: connectAccount,
			});
		} catch (error: any) {
			logger.error("❌ Create Connect account error:", error);

			if (error instanceof ApiError) {
				res.status(error.statusCode).json({
					success: false,
					error: {
						message: error.message,
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: {
						message: "Internal server error",
					},
				});
			}
		}
	}

	/**
	 * Get Connect account details
	 * GET /api/payments/connect/account
	 */
	async getConnectAccount(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user?.userId;

			if (!userId) {
				throw new ApiError(401, "Authentication required");
			}

			// Get Connect account ID from user profile in database
			const user = await UserModel.findById(userId);
			if (!user) {
				throw new ApiError(404, "User not found");
			}

			if (!user.stripe?.connectAccountId) {
				throw new ApiError(404, "No Connect account found. Please complete onboarding first.");
			}

			const connectAccount = await stripeService.getConnectAccount(user.stripe.connectAccountId);

			if (!connectAccount) {
				throw new ApiError(404, "Connect account not found in Stripe");
			}

			// Update local database with latest info from Stripe
			await UserModel.findByIdAndUpdate(userId, {
				$set: {
					'stripe.accountStatus': connectAccount.chargesEnabled ? 'active' : 'pending',
					'stripe.detailsSubmitted': connectAccount.detailsSubmitted,
					'stripe.chargesEnabled': connectAccount.chargesEnabled,
					'stripe.payoutsEnabled': connectAccount.payoutsEnabled,
				}
			});

			res.json({
				success: true,
				data: connectAccount,
			});
		} catch (error: any) {
			logger.error("❌ Get Connect account error:", error);

			if (error instanceof ApiError) {
				res.status(error.statusCode).json({
					success: false,
					error: {
						message: error.message,
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: {
						message: "Internal server error",
					},
				});
			}
		}
	}

	/**
	 * Create account link for Connect account dashboard
	 * POST /api/payments/connect/link
	 */
	async createAccountLink(req: Request, res: Response): Promise<void> {
		try {
			const { type = 'account_update' } = req.body;
			const userId = req.user?.userId;

			if (!userId) {
				throw new ApiError(401, "Authentication required");
			}

			// Get Connect account ID from user profile in database
			const user = await UserModel.findById(userId);
			if (!user) {
				throw new ApiError(404, "User not found");
			}

			if (!user.stripe?.connectAccountId) {
				throw new ApiError(404, "No Connect account found. Please complete onboarding first.");
			}

			const accountLink = await stripeService.createAccountLink(user.stripe.connectAccountId, type);

			res.json({
				success: true,
				data: {
					url: accountLink
				},
			});
		} catch (error: any) {
			logger.error("❌ Create account link error:", error);

			if (error instanceof ApiError) {
				res.status(error.statusCode).json({
					success: false,
					error: {
						message: error.message,
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: {
						message: "Internal server error",
					},
				});
			}
		}
	}
}

export const paymentController = new PaymentController();
