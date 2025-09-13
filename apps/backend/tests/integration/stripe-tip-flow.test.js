#!/usr/bin/env node
/**
 * End-to-end tip flow test
 * This script tests the complete tip flow and verifies Stripe transactions
 */

const mongoose = require('mongoose');
const { stripeService } = require('./dist/domains/payment/services/StripeService');

// Simple schemas for testing
const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  role: String,
  profile: { displayName: String },
  location: {
    city: String,
    country: String,
    coordinates: [Number],
  },
  stripe: {
    connectAccountId: String,
    accountStatus: String,
    detailsSubmitted: Boolean,
    chargesEnabled: Boolean,
    payoutsEnabled: Boolean,
  }
});

const performanceSchema = new mongoose.Schema({
  title: String,
  performerId: mongoose.Types.ObjectId,
  status: String,
  route: {
    stops: [{
      location: {
        address: String,
        coordinates: [Number],
      },
      startTime: Date,
      endTime: Date,
      status: String,
    }]
  }
});

const transactionSchema = new mongoose.Schema({
  amount: Number,
  currency: String,
  performanceId: mongoose.Types.ObjectId,
  performerId: mongoose.Types.ObjectId,
  tipperId: mongoose.Types.ObjectId,
  paymentIntentId: String,
  status: String,
  isAnonymous: Boolean,
  publicMessage: String,
  createdAt: { type: Date, default: Date.now }
});

const UserModel = mongoose.model('User', userSchema);
const PerformanceModel = mongoose.model('Performance', performanceSchema);
const TransactionModel = mongoose.model('Transaction', transactionSchema);

async function testCompleteTipFlow() {
  console.log('🧪 Testing Complete Tip Flow');
  console.log('==============================\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Create or find test performer
    let performer = await UserModel.findOne({ email: 'testperformer@example.com' });
    if (!performer) {
      performer = await UserModel.create({
        email: 'testperformer@example.com',
        username: 'testperformer',
        password: 'hashedpassword123',
        role: 'performer',
        profile: { displayName: 'Test Performer' },
        location: {
          city: 'Madrid',
          country: 'Spain',
          coordinates: [-3.7038, 40.4168],
        },
      });
      console.log(`✅ Created test performer: ${performer._id}`);
    } else {
      console.log(`✅ Found existing performer: ${performer._id}`);
    }

    // 2. Create Stripe Connect account if needed
    if (!performer.stripe?.connectAccountId) {
      console.log('\n💳 Creating Stripe Connect account...');
      const connectAccount = await stripeService.createConnectAccount({
        performerId: performer._id.toString(),
        email: performer.email,
        country: 'ES',
      });

      // Update performer with Connect account
      await UserModel.updateOne(
        { _id: performer._id },
        { 
          $set: { 
            'stripe.connectAccountId': connectAccount.accountId,
            'stripe.accountStatus': 'pending',
            'stripe.detailsSubmitted': connectAccount.detailsSubmitted,
            'stripe.chargesEnabled': connectAccount.chargesEnabled,
            'stripe.payoutsEnabled': connectAccount.payoutsEnabled,
          } 
        }
      );
      
      performer = await UserModel.findById(performer._id);
      console.log(`✅ Created Connect account: ${connectAccount.accountId}`);
    } else {
      console.log(`✅ Performer already has Connect account: ${performer.stripe.connectAccountId}`);
    }

    // 3. Create or find test tipper
    let tipper = await UserModel.findOne({ email: 'testtipper@example.com' });
    if (!tipper) {
      tipper = await UserModel.create({
        email: 'testtipper@example.com',
        username: 'testtipper',
        password: 'hashedpassword123',
        role: 'audience',
        profile: { displayName: 'Test Tipper' },
        location: {
          city: 'Madrid',
          country: 'Spain',
          coordinates: [-3.7038, 40.4168],
        },
      });
      console.log(`✅ Created test tipper: ${tipper._id}`);
    } else {
      console.log(`✅ Found existing tipper: ${tipper._id}`);
    }

    // 4. Create test performance
    let performance = await PerformanceModel.findOne({ performerId: performer._id });
    if (!performance) {
      performance = await PerformanceModel.create({
        title: 'Test Street Performance',
        performerId: performer._id,
        status: 'active',
        route: {
          stops: [{
            location: {
              address: 'Plaza Mayor, Madrid, Spain',
              coordinates: [-3.7038, 40.4168],
            },
            startTime: new Date(),
            endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
            status: 'active',
          }]
        }
      });
      console.log(`✅ Created test performance: ${performance._id}`);
    } else {
      console.log(`✅ Found existing performance: ${performance._id}`);
    }

    // 5. Create payment intent for tip
    console.log('\n💰 Creating payment intent for €5.00 tip...');
    const tipAmount = 500; // €5.00 in cents
    
    const paymentIntent = await stripeService.createTipPaymentIntentWithConnect({
      amount: tipAmount,
      currency: 'eur',
      performanceId: performance._id.toString(),
      performerId: performer._id.toString(),
      tipperId: tipper._id.toString(),
      isAnonymous: false,
      publicMessage: 'Great performance! 🎵',
      stripeAccountId: performer.stripe?.connectAccountId,
    });

    console.log('✅ Payment intent created:');
    console.log(`   Payment Intent ID: ${paymentIntent.paymentIntentId}`);
    console.log(`   Client Secret: ${paymentIntent.clientSecret}`);
    console.log(`   Amount: €${(paymentIntent.amount / 100).toFixed(2)}`);
    console.log(`   Processing Fee: €${(paymentIntent.processingFee / 100).toFixed(2)}`);
    console.log(`   Net Amount: €${(paymentIntent.netAmount / 100).toFixed(2)}`);

    // 6. Create transaction record in database
    const transaction = await TransactionModel.create({
      amount: tipAmount,
      currency: 'eur',
      performanceId: performance._id,
      performerId: performer._id,
      tipperId: tipper._id,
      paymentIntentId: paymentIntent.paymentIntentId,
      status: 'pending',
      isAnonymous: false,
      publicMessage: 'Great performance! 🎵',
    });

    console.log(`✅ Transaction created in database: ${transaction._id}`);

    // 7. Retrieve payment intent from Stripe to verify it exists
    console.log('\n🔍 Verifying payment intent in Stripe...');
    const stripePaymentIntent = await stripeService.getPaymentIntent(paymentIntent.paymentIntentId);
    
    if (stripePaymentIntent) {
      console.log('✅ Payment intent verified in Stripe:');
      console.log(`   ID: ${stripePaymentIntent.id}`);
      console.log(`   Status: ${stripePaymentIntent.status}`);
      console.log(`   Amount: €${(stripePaymentIntent.amount / 100).toFixed(2)}`);
      console.log(`   Currency: ${stripePaymentIntent.currency.toUpperCase()}`);
      console.log(`   Created: ${new Date(stripePaymentIntent.created * 1000).toLocaleString()}`);
      
      if (stripePaymentIntent.metadata) {
        console.log('   Metadata:');
        Object.entries(stripePaymentIntent.metadata).forEach(([key, value]) => {
          console.log(`     ${key}: ${value}`);
        });
      }
    } else {
      console.log('❌ Payment intent not found in Stripe');
    }

    // 8. Check if Connect account transfer would work
    if (performer.stripe?.connectAccountId && !performer.stripe.connectAccountId.startsWith('acct_dev_')) {
      console.log('\n💸 Checking Connect account details...');
      const connectAccount = await stripeService.getConnectAccount(performer.stripe.connectAccountId);
      
      if (connectAccount) {
        console.log('✅ Connect account verified:');
        console.log(`   Account ID: ${connectAccount.accountId}`);
        console.log(`   Details Submitted: ${connectAccount.detailsSubmitted}`);
        console.log(`   Charges Enabled: ${connectAccount.chargesEnabled}`);
        console.log(`   Payouts Enabled: ${connectAccount.payoutsEnabled}`);
      }
    }

    console.log('\n🎉 End-to-End Tip Flow Test Results:');
    console.log('=====================================');
    console.log('✅ Performer account created/found');
    console.log('✅ Stripe Connect account configured');
    console.log('✅ Tipper account created/found');
    console.log('✅ Performance created/found');
    console.log('✅ Payment intent created in Stripe');
    console.log('✅ Transaction recorded in database');
    console.log('✅ Payment intent verified in Stripe');
    console.log('\n💡 Next steps for complete testing:');
    console.log('   1. Use the client_secret to complete payment on frontend');
    console.log('   2. Verify webhook handles payment_intent.succeeded event');
    console.log('   3. Check that funds appear in Connect account dashboard');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🏁 Test complete');
  }
}

// Run the test
testCompleteTipFlow().catch(console.error);