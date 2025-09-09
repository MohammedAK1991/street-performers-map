import Stripe from "stripe";
import { logger } from "../../../shared/utils/logger";

export interface CreatePaymentIntentRequest {
	amount: number; // Amount in cents
	currency: string;
	performanceId: string;
	performerId: string;
	tipperId?: string; // Optional for anonymous tips
	isAnonymous?: boolean;
	publicMessage?: string;
	paymentMethodTypes?: string[];
	stripeAccountId?: string; // For direct payouts to performer
}

export interface PaymentIntentResult {
	paymentIntentId: string;
	clientSecret: string;
	amount: number;
	processingFee: number;
	netAmount: number;
}

export interface StripeConnectAccount {
	accountId: string;
	loginUrl: string;
	detailsSubmitted: boolean;
	chargesEnabled: boolean;
	payoutsEnabled: boolean;
}

export interface CreateConnectAccountRequest {
	performerId: string;
	email: string;
	country: string;
	businessType?: 'individual' | 'company';
}

export class StripeService {
	private stripe: Stripe;
	private readonly webhookSecret: string;

	constructor() {
		const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
		this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

		// Use test mode if no key is provided or if it's a placeholder
		const isTestMode =
			!stripeSecretKey ||
			stripeSecretKey === "sk_test_your_stripe_secret_key_here" ||
			stripeSecretKey === "sk_test_51234567890abcdef";

		if (isTestMode) {
			logger.warn(
				"⚠️ Stripe running in test mode. Using mock implementation for development.",
			);
			// Create a mock Stripe instance for development
			this.stripe = {} as Stripe;
			return;
		}

		try {
			this.stripe = new Stripe(stripeSecretKey, {
				apiVersion: "2025-08-27.basil", // Use latest API version
				typescript: true,
			});
			logger.info("✅ Stripe initialized successfully");
		} catch (error) {
			logger.error("❌ Failed to initialize Stripe:", error);
			throw new Error("Stripe initialization failed");
		}
	}

	/**
	 * Create a payment intent for a tip
	 */
	async createTipPaymentIntent(
		request: CreatePaymentIntentRequest,
	): Promise<PaymentIntentResult> {
		const {
			amount,
			currency,
			performanceId,
			performerId,
			tipperId,
			isAnonymous,
			publicMessage,
		} = request;

		// Validate amount (minimum €0.50, maximum €100)
		if (amount < 50 || amount > 10000) {
			throw new Error("Tip amount must be between €0.50 and €100.00");
		}

		// Check if Stripe is configured
		if (!this.stripe.paymentIntents) {
			// Return mock result for development
			logger.warn(
				"⚠️ Stripe not configured. Returning mock payment intent for development.",
			);

			const mockProcessingFee = Math.round(amount * 0.029 + 30); // Stripe's standard fee
			const mockNetAmount = amount - mockProcessingFee;

			return {
				paymentIntentId: `pi_mock_${Date.now()}`,
				clientSecret: `pi_mock_${Date.now()}_secret_mock`,
				amount,
				processingFee: mockProcessingFee,
				netAmount: mockNetAmount,
			};
		}

		try {
			// Calculate Stripe fees (2.9% + €0.30 for European cards)
			const processingFee = Math.round(amount * 0.029 + 30);
			const netAmount = amount - processingFee;

			const paymentIntent = await this.stripe.paymentIntents.create({
				amount,
				currency: currency.toLowerCase(),
				payment_method_types: request.paymentMethodTypes || ["card"],
				metadata: {
					type: "tip",
					performanceId,
					performerId,
					tipperId: tipperId || "anonymous",
					isAnonymous: String(isAnonymous || false),
					publicMessage: publicMessage || "",
					processingFee: String(processingFee),
					netAmount: String(netAmount),
				},
				description: `Tip for street performance ${performanceId}`,
				statement_descriptor_suffix: "Street Music", // Shows on bank statement
			});

			logger.info(
				`💳 Created payment intent: ${paymentIntent.id} for €${(amount / 100).toFixed(2)}`,
			);

			return {
				paymentIntentId: paymentIntent.id,
				clientSecret: paymentIntent.client_secret || "",
				amount,
				processingFee,
				netAmount,
			};
		} catch (error: any) {
			logger.error("❌ Failed to create payment intent:", error);
			throw new Error(`Payment intent creation failed: ${error.message}`);
		}
	}

	/**
	 * Retrieve a payment intent
	 */
	async getPaymentIntent(
		paymentIntentId: string,
	): Promise<Stripe.PaymentIntent | null> {
		if (!this.stripe.paymentIntents) {
			logger.warn("⚠️ Stripe not configured. Returning mock payment intent.");
			return null;
		}

		try {
			const paymentIntent =
				await this.stripe.paymentIntents.retrieve(paymentIntentId);
			return paymentIntent;
		} catch (error: any) {
			logger.error(
				`❌ Failed to retrieve payment intent ${paymentIntentId}:`,
				error,
			);
			return null;
		}
	}

	/**
	 * Confirm a payment intent (usually done client-side, but useful for testing)
	 */
	async confirmPaymentIntent(
		paymentIntentId: string,
		paymentMethodId: string,
	): Promise<Stripe.PaymentIntent> {
		if (!this.stripe.paymentIntents) {
			throw new Error("Stripe not configured");
		}

		try {
			const paymentIntent = await this.stripe.paymentIntents.confirm(
				paymentIntentId,
				{
					payment_method: paymentMethodId,
				},
			);

			logger.info(`✅ Confirmed payment intent: ${paymentIntent.id}`);
			return paymentIntent;
		} catch (error: any) {
			logger.error(
				`❌ Failed to confirm payment intent ${paymentIntentId}:`,
				error,
			);
			throw new Error(`Payment confirmation failed: ${error.message}`);
		}
	}

	/**
	 * Handle Stripe webhook events
	 */
	async handleWebhookEvent(body: string, signature: string): Promise<void> {
		if (!this.stripe.webhooks || !this.webhookSecret) {
			logger.warn("⚠️ Stripe webhooks not configured");
			return;
		}

		try {
			const event = this.stripe.webhooks.constructEvent(
				body,
				signature,
				this.webhookSecret,
			);

			logger.info(`📨 Received Stripe webhook: ${event.type}`);

			switch (event.type) {
				case "payment_intent.succeeded":
					await this.handlePaymentSucceeded(
						event.data.object as Stripe.PaymentIntent,
					);
					break;

				case "payment_intent.payment_failed":
					await this.handlePaymentFailed(
						event.data.object as Stripe.PaymentIntent,
					);
					break;

				case "payment_intent.canceled":
					await this.handlePaymentCanceled(
						event.data.object as Stripe.PaymentIntent,
					);
					break;

				default:
					logger.info(`🤷 Unhandled webhook event type: ${event.type}`);
			}
		} catch (error: any) {
			logger.error("❌ Webhook signature verification failed:", error);
			throw new Error(`Webhook verification failed: ${error.message}`);
		}
	}

	/**
	 * Handle successful payment
	 */
	private async handlePaymentSucceeded(
		paymentIntent: Stripe.PaymentIntent,
	): Promise<void> {
		const { id, metadata } = paymentIntent;

		logger.info(`✅ Payment succeeded: ${id}`);
		logger.info("📊 Payment metadata:", metadata);

		// TODO: Update transaction status in database
		// TODO: Notify performer of tip received
		// TODO: Update performance tip count
		// TODO: Trigger real-time updates
	}

	/**
	 * Handle failed payment
	 */
	private async handlePaymentFailed(
		paymentIntent: Stripe.PaymentIntent,
	): Promise<void> {
		const { id, last_payment_error } = paymentIntent;

		logger.error(`❌ Payment failed: ${id}`);
		logger.error("💥 Payment error:", last_payment_error);

		// TODO: Update transaction status in database
		// TODO: Notify user of payment failure
		// TODO: Provide retry options
	}

	/**
	 * Handle canceled payment
	 */
	private async handlePaymentCanceled(
		paymentIntent: Stripe.PaymentIntent,
	): Promise<void> {
		const { id } = paymentIntent;

		logger.info(`❌ Payment canceled: ${id}`);

		// TODO: Update transaction status in database
		// TODO: Clean up any pending records
	}

	/**
	 * Get payment method types for a country
	 */
	getPaymentMethodTypes(country: string): string[] {
		const baseTypes = ["card"];

		switch (country?.toLowerCase()) {
			case "es": // Spain
				return [...baseTypes, "bizum"];
			case "de": // Germany
				return [...baseTypes, "sofort", "giropay"];
			case "fr": // France
				return [...baseTypes, "bancontact"];
			case "nl": // Netherlands
				return [...baseTypes, "ideal"];
			default:
				return baseTypes;
		}
	}

	/**
	 * Calculate fees for a given amount
	 */
	calculateFees(amount: number): { processingFee: number; netAmount: number } {
		// Stripe's standard fee: 2.9% + €0.30
		const processingFee = Math.round(amount * 0.029 + 30);
		const netAmount = amount - processingFee;

		return { processingFee, netAmount };
	}

	/**
	 * Create a Stripe Connect Express account for a performer
	 */
	async createConnectAccount(request: CreateConnectAccountRequest): Promise<StripeConnectAccount> {
		if (!this.stripe.accounts) {
			// Return mock result for development
			logger.warn("⚠️ Stripe not configured. Returning mock connect account for development.");
			
			const mockAccountId = `acct_mock_${Date.now()}`;
			return {
				accountId: mockAccountId,
				loginUrl: `https://connect.stripe.com/express/oauth/authorize?redirect_uri=${encodeURIComponent('https://your-app.com/connect/return')}&client_id=ca_mock&state=${request.performerId}`,
				detailsSubmitted: false,
				chargesEnabled: false,
				payoutsEnabled: false
			};
		}

		try {
			const account = await this.stripe.accounts.create({
				type: 'express',
				country: request.country.toUpperCase(),
				email: request.email,
				business_type: request.businessType || 'individual',
				metadata: {
					performerId: request.performerId
				},
				capabilities: {
					card_payments: { requested: true },
					transfers: { requested: true },
				},
				business_profile: {
					product_description: 'Street performance tips and earnings',
					mcc: '7929' // Band, Orchestra, and Miscellaneous Entertainers
				}
			});

			// Create account link for onboarding
			const accountLink = await this.stripe.accountLinks.create({
				account: account.id,
				refresh_url: `${process.env.FRONTEND_URL}/connect/refresh`,
				return_url: `${process.env.FRONTEND_URL}/connect/return`,
				type: 'account_onboarding',
			});

			logger.info(`✅ Created Stripe Connect account: ${account.id} for performer: ${request.performerId}`);

			return {
				accountId: account.id,
				loginUrl: accountLink.url,
				detailsSubmitted: account.details_submitted || false,
				chargesEnabled: account.charges_enabled || false,
				payoutsEnabled: account.payouts_enabled || false
			};

		} catch (error: any) {
			logger.error('❌ Failed to create Stripe Connect account:', error);
			throw new Error(`Connect account creation failed: ${error.message}`);
		}
	}

	/**
	 * Get Stripe Connect account details
	 */
	async getConnectAccount(accountId: string): Promise<StripeConnectAccount | null> {
		if (!this.stripe.accounts) {
			logger.warn("⚠️ Stripe not configured. Returning mock account details.");
			return {
				accountId,
				loginUrl: 'https://connect.stripe.com/express/mock',
				detailsSubmitted: true,
				chargesEnabled: true,
				payoutsEnabled: true
			};
		}

		try {
			const account = await this.stripe.accounts.retrieve(accountId);
			
			return {
				accountId: account.id,
				loginUrl: '', // Will be generated when needed
				detailsSubmitted: account.details_submitted || false,
				chargesEnabled: account.charges_enabled || false,
				payoutsEnabled: account.payouts_enabled || false
			};

		} catch (error: any) {
			logger.error(`❌ Failed to retrieve connect account ${accountId}:`, error);
			return null;
		}
	}

	/**
	 * Create account link for existing connect account (for re-onboarding or dashboard access)
	 */
	async createAccountLink(accountId: string, type: 'account_onboarding' | 'account_update' = 'account_update'): Promise<string> {
		if (!this.stripe.accountLinks) {
			logger.warn("⚠️ Stripe not configured. Returning mock account link.");
			return `https://connect.stripe.com/express/mock?account=${accountId}&type=${type}`;
		}

		try {
			const accountLink = await this.stripe.accountLinks.create({
				account: accountId,
				refresh_url: `${process.env.FRONTEND_URL}/connect/refresh`,
				return_url: `${process.env.FRONTEND_URL}/connect/return`,
				type,
			});

			return accountLink.url;

		} catch (error: any) {
			logger.error(`❌ Failed to create account link for ${accountId}:`, error);
			throw new Error(`Account link creation failed: ${error.message}`);
		}
	}

	/**
	 * Create a transfer to a connect account (payout to performer)
	 */
	async createTransfer(amount: number, destinationAccountId: string, transferGroup?: string): Promise<string> {
		if (!this.stripe.transfers) {
			logger.warn("⚠️ Stripe not configured. Returning mock transfer ID.");
			return `tr_mock_${Date.now()}`;
		}

		try {
			const transfer = await this.stripe.transfers.create({
				amount,
				currency: 'eur',
				destination: destinationAccountId,
				transfer_group: transferGroup,
				metadata: {
					type: 'performer_payout'
				}
			});

			logger.info(`💸 Created transfer: ${transfer.id} for €${(amount / 100).toFixed(2)} to account: ${destinationAccountId}`);
			return transfer.id;

		} catch (error: any) {
			logger.error(`❌ Failed to create transfer to ${destinationAccountId}:`, error);
			throw new Error(`Transfer creation failed: ${error.message}`);
		}
	}

	/**
	 * Enhanced payment intent creation with Connect account support
	 */
	async createTipPaymentIntentWithConnect(
		request: CreatePaymentIntentRequest,
	): Promise<PaymentIntentResult> {
		const {
			amount,
			currency,
			performanceId,
			performerId,
			tipperId,
			isAnonymous,
			publicMessage,
			stripeAccountId
		} = request;

		// Validate amount (minimum €0.50, maximum €100)
		if (amount < 50 || amount > 10000) {
			throw new Error("Tip amount must be between €0.50 and €100.00");
		}

		// Check if Stripe is configured
		if (!this.stripe.paymentIntents) {
			// Return mock result for development
			logger.warn("⚠️ Stripe not configured. Returning mock payment intent for development.");

			const mockProcessingFee = Math.round(amount * 0.029 + 30);
			const mockNetAmount = amount - mockProcessingFee;

			return {
				paymentIntentId: `pi_mock_${Date.now()}`,
				clientSecret: `pi_mock_${Date.now()}_secret_mock`,
				amount,
				processingFee: mockProcessingFee,
				netAmount: mockNetAmount,
			};
		}

		try {
			// Calculate fees
			const applicationFeeAmount = Math.round(amount * 0.05); // 5% platform fee
			const processingFee = Math.round(amount * 0.029 + 30); // Stripe's fee
			const netAmount = amount - processingFee - applicationFeeAmount;

			const paymentIntentData: Stripe.PaymentIntentCreateParams = {
				amount,
				currency: currency.toLowerCase(),
				payment_method_types: request.paymentMethodTypes || ["card"],
				metadata: {
					type: "tip",
					performanceId,
					performerId,
					tipperId: tipperId || "anonymous",
					isAnonymous: String(isAnonymous || false),
					publicMessage: publicMessage || "",
					processingFee: String(processingFee),
					applicationFee: String(applicationFeeAmount),
					netAmount: String(netAmount),
				},
				description: `Tip for street performance ${performanceId}`,
				statement_descriptor_suffix: "Street Music",
			};

			// If performer has Connect account, use direct charge
			if (stripeAccountId) {
				paymentIntentData.application_fee_amount = applicationFeeAmount;
				paymentIntentData.on_behalf_of = stripeAccountId;
				paymentIntentData.transfer_data = {
					destination: stripeAccountId,
				};
			}

			const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

			logger.info(
				`💳 Created payment intent: ${paymentIntent.id} for €${(amount / 100).toFixed(2)}${stripeAccountId ? ` with Connect account: ${stripeAccountId}` : ''}`
			);

			return {
				paymentIntentId: paymentIntent.id,
				clientSecret: paymentIntent.client_secret || "",
				amount,
				processingFee: processingFee + applicationFeeAmount,
				netAmount,
			};

		} catch (error: any) {
			logger.error("❌ Failed to create payment intent with Connect:", error);
			throw new Error(`Payment intent creation failed: ${error.message}`);
		}
	}

	/**
	 * Check if Stripe is properly configured
	 */
	isConfigured(): boolean {
		return Boolean(this.stripe.paymentIntents && process.env.STRIPE_SECRET_KEY);
	}
}

// Export singleton instance
export const stripeService = new StripeService();
