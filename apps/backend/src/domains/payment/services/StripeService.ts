import Stripe from 'stripe';
import { logger } from '../../../shared/utils/logger';

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
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const isDevelopment = process.env.NODE_ENV === 'development';

    // In development, allow missing keys but log warnings
    if (!stripeSecretKey) {
      if (isDevelopment) {
        logger.warn('⚠️ STRIPE_SECRET_KEY not set - running in development mock mode');
        this.stripe = {} as Stripe; // Mock for development
        return;
      } else {
        logger.error('❌ STRIPE_SECRET_KEY is required in production');
        throw new Error('STRIPE_SECRET_KEY environment variable is required');
      }
    }

    if (!this.webhookSecret && !isDevelopment) {
      logger.error('❌ STRIPE_WEBHOOK_SECRET is required in production');
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }

    try {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-08-27.basil', // Use latest API version
        typescript: true,
      });
      logger.info('✅ Stripe initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Stripe:', error);
      throw new Error('Stripe initialization failed');
    }
  }

  /**
   * Create a payment intent for a tip
   */
  async createTipPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResult> {
    const { amount, currency, performanceId, performerId, tipperId, isAnonymous, publicMessage } =
      request;

    // Validate amount (minimum €0.50, maximum €100)
    if (amount < 50 || amount > 10000) {
      throw new Error('Tip amount must be between €0.50 and €100.00');
    }

    // Check if running in development without Stripe
    if (!this.stripe.paymentIntents) {
      logger.warn('⚠️ Development mode - returning mock payment intent');
      const mockProcessingFee = Math.round(amount * 0.029 + 30);
      const mockNetAmount = amount - mockProcessingFee;

      return {
        paymentIntentId: `pi_dev_${Date.now()}`,
        clientSecret: `pi_dev_${Date.now()}_secret_mock`,
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
        payment_method_types: request.paymentMethodTypes || ['card'],
        metadata: {
          type: 'tip',
          performanceId,
          performerId,
          tipperId: tipperId || 'anonymous',
          isAnonymous: String(isAnonymous || false),
          publicMessage: publicMessage || '',
          processingFee: String(processingFee),
          netAmount: String(netAmount),
        },
        description: `Tip for street performance ${performanceId}`,
        statement_descriptor_suffix: 'Street Music', // Shows on bank statement
      });

      logger.info(
        `💳 Created payment intent: ${paymentIntent.id} for €${(amount / 100).toFixed(2)}`
      );

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || '',
        amount,
        processingFee,
        netAmount,
      };
    } catch (error: unknown) {
      logger.error('❌ Failed to create payment intent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Payment intent creation failed: ${errorMessage}`);
    }
  }

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error: any) {
      logger.error(`❌ Failed to retrieve payment intent ${paymentIntentId}:`, error);
      return null;
    }
  }

  /**
   * Confirm a payment intent (usually done client-side, but useful for testing)
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      logger.info(`✅ Confirmed payment intent: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error: any) {
      logger.error(`❌ Failed to confirm payment intent ${paymentIntentId}:`, error);
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(body: string | Buffer, signature: string): Promise<void> {
    // Convert Buffer to string if needed
    const bodyString = body instanceof Buffer ? body.toString() : body;

    // In development mode without webhook secret, skip verification
    if (process.env.NODE_ENV === 'development' && !this.webhookSecret) {
      logger.warn('⚠️ Development mode - skipping webhook signature verification');
      try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const event = JSON.parse(bodyString as string);
        await this.processWebhookEvent(event);
        return;
      } catch (error) {
        logger.error('❌ Failed to parse webhook body in development mode:', error);
        throw new Error('Invalid webhook body');
      }
    }

    // Production mode - require signature verification
    if (!this.webhookSecret) {
      logger.error('❌ STRIPE_WEBHOOK_SECRET is required for webhook verification');
      throw new Error('Webhook secret not configured');
    }

    try {
      // Use original body (Buffer or string) for signature verification
      // constructEvent accepts string | Buffer according to Stripe docs
      const event = this.stripe.webhooks.constructEvent(body as any, signature, this.webhookSecret);
      await this.processWebhookEvent(event);
    } catch (error: any) {
      logger.error('❌ Webhook signature verification failed:', error);
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }

  /**
   * Process webhook event (common for both verified and development events)
   */
  private async processWebhookEvent(event: Stripe.Event): Promise<void> {
    logger.info(`📨 Processing Stripe webhook: ${event.type} (ID: ${event.id})`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        case 'account.updated':
          await this.handleConnectAccountUpdated(event.data.object as Stripe.Account);
          break;

        case 'charge.succeeded':
          logger.info(`💳 Charge succeeded: ${(event.data.object as Stripe.Charge).id}`);
          break;

        case 'transfer.created':
          logger.info(`💸 Transfer created: ${(event.data.object as Stripe.Transfer).id}`);
          break;

        default:
          logger.info(`🤷 Unhandled webhook event type: ${event.type}`);
      }

      logger.info(`✅ Successfully processed webhook: ${event.type} (ID: ${event.id})`);
    } catch (error) {
      logger.error(`❌ Failed to process webhook ${event.type} (ID: ${event.id}):`, error);
      throw error; // Re-throw to signal webhook failure
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const { id, metadata } = paymentIntent;

    logger.info(`✅ Payment succeeded: ${id}`);
    logger.info('📊 Payment metadata:', metadata);

    try {
      // Import here to avoid circular dependencies
      const { paymentService } = await import('./PaymentService');
      const { UserModel } = await import('../../user/entities/User');

      // Get charges for this payment intent
      const charges = await this.stripe.charges.list({
        payment_intent: id,
        limit: 1,
      });
      const chargeId = charges.data[0]?.id || `mock_charge_${Date.now()}`;

      // Update transaction status in database
      await paymentService.updateTransactionStatus(id, 'completed', chargeId);

      // Update performer statistics if we have performer ID
      if (metadata.performerId && metadata.performerId !== 'anonymous') {
        try {
          await UserModel.findByIdAndUpdate(metadata.performerId, {
            $inc: {
              'statistics.totalTips': 1,
              'statistics.totalEarnings': parseInt(metadata.netAmount || '0', 10),
            },
          });
          logger.info(`📈 Updated statistics for performer: ${metadata.performerId}`);
        } catch (error) {
          logger.error('❌ Failed to update performer statistics:', error);
        }
      }

      // Log success details
      logger.info(
        `🎉 Tip payment completed: €${(paymentIntent.amount / 100).toFixed(2)} for performance ${metadata.performanceId}`
      );
    } catch (error) {
      logger.error('❌ Failed to handle payment success:', error);
      // Don't throw - webhook should still return 200 to Stripe
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const { id, last_payment_error, metadata } = paymentIntent;

    logger.error(`❌ Payment failed: ${id}`);
    logger.error('💥 Payment error:', last_payment_error);

    try {
      // Import here to avoid circular dependencies
      const { paymentService } = await import('./PaymentService');

      // Update transaction status in database
      await paymentService.updateTransactionStatus(
        id,
        'failed',
        undefined,
        last_payment_error?.message || 'Payment failed'
      );

      logger.info(
        `💥 Payment failure recorded for: €${(paymentIntent.amount / 100).toFixed(2)} for performance ${metadata.performanceId}`
      );
    } catch (error) {
      logger.error('❌ Failed to handle payment failure:', error);
      // Don't throw - webhook should still return 200 to Stripe
    }
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const { id } = paymentIntent;

    logger.info(`❌ Payment canceled: ${id}`);

    // TODO: Update transaction status in database
    // TODO: Clean up any pending records
  }

  /**
   * Handle Connect account updates
   */
  private async handleConnectAccountUpdated(account: Stripe.Account): Promise<void> {
    const { id, details_submitted, charges_enabled, payouts_enabled } = account;

    logger.info(`🔄 Connect account updated: ${id}`);

    // TODO: Update user's Stripe account status in database
    // This would sync the account status from Stripe back to your database
    try {
      // You'd implement UserModel.updateOne to update the user's stripe fields
      logger.info(
        `📊 Account status - Details: ${details_submitted}, Charges: ${charges_enabled}, Payouts: ${payouts_enabled}`
      );
    } catch (error) {
      logger.error(`❌ Failed to update Connect account ${id} in database:`, error);
    }
  }

  /**
   * Get payment method types for a country
   */
  getPaymentMethodTypes(country: string): string[] {
    const baseTypes = ['card'];

    switch (country?.toLowerCase()) {
      case 'es': // Spain
        return [...baseTypes, 'bizum'];
      case 'de': // Germany
        return [...baseTypes, 'sofort', 'giropay'];
      case 'fr': // France
        return [...baseTypes, 'bancontact'];
      case 'nl': // Netherlands
        return [...baseTypes, 'ideal'];
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
    logger.info(`🔄 Creating Stripe Connect account for ${request.email}`);

    // Check if running in development mode
    if (process.env.NODE_ENV === 'development') {
      logger.warn('⚠️ Development mode - returning mock Connect account');

      return {
        accountId: `acct_dev_${Date.now()}`,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connect/mock-onboarding`,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      };
    }

    try {
      // Create Express account using official Stripe documentation format
      const account = await this.stripe.accounts.create({
        country: request.country || 'ES',
        email: request.email,
        controller: {
          fees: {
            payer: 'application',
          },
          losses: {
            payments: 'application',
          },
          stripe_dashboard: {
            type: 'express',
          },
        },
      });

      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connect/refresh/${account.id}`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connect/return`,
        type: 'account_onboarding',
      });

      logger.info(
        `✅ Created Stripe Connect account: ${account.id} for performer: ${request.performerId}`
      );

      return {
        accountId: account.id,
        loginUrl: accountLink.url,
        detailsSubmitted: account.details_submitted || false,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
      };
    } catch (error: any) {
      logger.error('❌ Failed to create Stripe Connect account:', error);

      // If Connect isn't enabled, fall back to mock mode
      if (error.message?.includes('signed up for Connect')) {
        logger.warn('⚠️ Stripe Connect not enabled - falling back to development mode');
        return {
          accountId: `acct_dev_${Date.now()}`,
          loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connect/mock-onboarding`,
          detailsSubmitted: false,
          chargesEnabled: false,
          payoutsEnabled: false,
        };
      }

      throw new Error(`Connect account creation failed: ${error.message}`);
    }
  }

  /**
   * Get Stripe Connect account details
   */
  async getConnectAccount(accountId: string): Promise<StripeConnectAccount | null> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);

      return {
        accountId: account.id,
        loginUrl: '', // Will be generated when needed
        detailsSubmitted: account.details_submitted || false,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
      };
    } catch (error: any) {
      logger.error(`❌ Failed to retrieve connect account ${accountId}:`, error);
      return null;
    }
  }

  /**
   * Create account link for existing connect account (for re-onboarding or dashboard access)
   */
  async createAccountLink(
    accountId: string,
    type: 'account_onboarding' | 'account_update' = 'account_update'
  ): Promise<string> {
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
  async createTransfer(
    amount: number,
    destinationAccountId: string,
    transferGroup?: string
  ): Promise<string> {
    logger.info(
      `💸 Creating transfer of €${(amount / 100).toFixed(2)} to account ${destinationAccountId}`
    );

    try {
      const transfer = await this.stripe.transfers.create({
        amount,
        currency: 'eur',
        destination: destinationAccountId,
        transfer_group: transferGroup,
        metadata: {
          type: 'performer_payout',
        },
      });

      logger.info(
        `💸 Created transfer: ${transfer.id} for €${(amount / 100).toFixed(2)} to account: ${destinationAccountId}`
      );
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
    request: CreatePaymentIntentRequest
  ): Promise<PaymentIntentResult> {
    const {
      amount,
      currency,
      performanceId,
      performerId,
      tipperId,
      isAnonymous,
      publicMessage,
      stripeAccountId,
    } = request;

    // Validate amount (minimum €0.50, maximum €100)
    if (amount < 50 || amount > 10000) {
      throw new Error('Tip amount must be between €0.50 and €100.00');
    }

    // Stripe is required to be configured at this point

    try {
      // Calculate fees
      const applicationFeeAmount = Math.round(amount * 0.05); // 5% platform fee
      const processingFee = Math.round(amount * 0.029 + 30); // Stripe's fee
      const netAmount = amount - processingFee - applicationFeeAmount;

      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount,
        currency: currency.toLowerCase(),
        payment_method_types: request.paymentMethodTypes || ['card'],
        metadata: {
          type: 'tip',
          performanceId,
          performerId,
          tipperId: tipperId || 'anonymous',
          isAnonymous: String(isAnonymous || false),
          publicMessage: publicMessage || '',
          processingFee: String(processingFee),
          applicationFee: String(applicationFeeAmount),
          netAmount: String(netAmount),
        },
        description: `Tip for street performance ${performanceId}`,
        statement_descriptor_suffix: 'Street Music',
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
        clientSecret: paymentIntent.client_secret || '',
        amount,
        processingFee: processingFee + applicationFeeAmount,
        netAmount,
      };
    } catch (error: any) {
      logger.error('❌ Failed to create payment intent with Connect:', error);
      throw new Error(`Payment intent creation failed: ${error.message}`);
    }
  }

  /**
   * Check if Stripe is properly configured
   */
  isConfigured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  }
}

// Export singleton instance
export const stripeService = new StripeService();
