// Test payment status for the pending tip
const paymentIntentId = 'pi_3S7GPhFO1izNNynG1UvZnuQE';

console.log('🔍 Checking payment intent:', paymentIntentId);

async function testPayment() {
  try {
    // Import Stripe directly
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    console.log('💳 Fetching payment intent from Stripe...');
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log('📊 Payment Intent Details:');
    console.log('- Status:', paymentIntent.status);
    console.log('- Amount:', (paymentIntent.amount / 100).toFixed(2), paymentIntent.currency.toUpperCase());
    console.log('- Created:', new Date(paymentIntent.created * 1000).toISOString());
    console.log('- Last payment error:', paymentIntent.last_payment_error);

    if (paymentIntent.status === 'succeeded') {
      console.log('✅ Payment succeeded in Stripe!');

      // Connect to MongoDB and update manually
      const mongoose = require('mongoose');
      await mongoose.connect(process.env.MONGODB_URI);

      console.log('🔄 Updating transaction in database...');

      const Transaction = require('./apps/backend/dist/domains/payment/entities/Transaction').Transaction;

      const transaction = await Transaction.findOne({
        stripePaymentIntentId: paymentIntentId
      });

      if (transaction) {
        console.log('📄 Found transaction:', transaction._id);
        console.log('📄 Current status:', transaction.status);

        if (transaction.status === 'pending') {
          await transaction.markCompleted('manual_update_charge');
          console.log('✅ Transaction updated to completed');
        } else {
          console.log('ℹ️ Transaction already has status:', transaction.status);
        }
      } else {
        console.log('❌ Transaction not found in database');
      }

      await mongoose.disconnect();
    } else {
      console.log(`ℹ️ Payment status is: ${paymentIntent.status}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPayment();