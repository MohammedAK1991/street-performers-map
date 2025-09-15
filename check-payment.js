// Quick script to check payment intent status
const paymentIntentId = 'pi_3S7D1AFO1iZNNyNG1Zhb5dn8';

console.log('🔍 Checking payment intent:', paymentIntentId);
console.log('Environment:', process.env.NODE_ENV);

// Import Stripe service and check payment
async function checkPayment() {
  try {
    const { stripeService } = await import('./apps/backend/dist/domains/payment/services/StripeService.js');

    if (!stripeService.isConfigured()) {
      console.log('❌ Stripe not configured - missing environment variables');
      return;
    }

    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);

    if (paymentIntent) {
      console.log('💳 Payment Intent Status:', paymentIntent.status);
      console.log('💳 Amount:', (paymentIntent.amount / 100).toFixed(2), paymentIntent.currency.toUpperCase());
      console.log('💳 Created:', new Date(paymentIntent.created * 1000).toISOString());
      console.log('💳 Metadata:', paymentIntent.metadata);

      if (paymentIntent.status === 'succeeded') {
        console.log('✅ Payment succeeded in Stripe - webhook may have failed');

        // Try to manually update the transaction status
        const { paymentService } = await import('./apps/backend/dist/domains/payment/services/PaymentService.js');

        console.log('🔄 Attempting to update transaction status...');
        await paymentService.updateTransactionStatus(
          paymentIntentId,
          'completed',
          paymentIntent.latest_charge?.toString() || 'manual_update'
        );
        console.log('✅ Transaction status updated manually');
      }
    } else {
      console.log('❌ Payment intent not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPayment();