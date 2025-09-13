#!/usr/bin/env node
/**
 * Test script for Stripe Connect account creation
 */

const mongoose = require('mongoose');
const { stripeService } = require('./dist/domains/payment/services/StripeService');

// Simple user schema for this test
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['performer', 'audience'], required: true },
  profile: {
    displayName: { type: String, required: true },
  },
  location: {
    city: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: { type: [Number], required: true },
  },
});

const UserModel = mongoose.model('User', userSchema);

async function testConnectAccount() {
  console.log('🧪 Testing Stripe Connect Account Creation');
  console.log('=========================================\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create or find test user
    const testEmail = 'testperformer@example.com';
    let user = await UserModel.findOne({ email: testEmail });

    if (!user) {
      console.log('👤 Creating test performer...');
      user = await UserModel.create({
        email: testEmail,
        username: 'testperformer',
        password: 'hashedpassword123',
        role: 'performer',
        profile: {
          displayName: 'Test Performer',
        },
        location: {
          city: 'Madrid',
          country: 'Spain',
          coordinates: [-3.7038, 40.4168],
        },
      });
      console.log(`✅ Created test user: ${user._id}`);
    } else {
      console.log(`✅ Found existing user: ${user._id}`);
    }

    // Test Stripe Connect account creation
    console.log('\n💳 Testing Stripe Connect account creation...');
    
    const connectAccount = await stripeService.createConnectAccount({
      performerId: user._id.toString(),
      email: user.email,
      country: 'ES',
    });

    console.log('🎉 SUCCESS! Connect account created:');
    console.log(`   Account ID: ${connectAccount.accountId}`);
    console.log(`   Login URL: ${connectAccount.loginUrl}`);
    console.log(`   Details Submitted: ${connectAccount.detailsSubmitted}`);
    console.log(`   Charges Enabled: ${connectAccount.chargesEnabled}`);
    console.log(`   Payouts Enabled: ${connectAccount.payoutsEnabled}`);

    // Update user with Connect account ID (if real account)
    if (!connectAccount.accountId.startsWith('acct_dev_')) {
      await UserModel.updateOne(
        { _id: user._id },
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
      console.log('✅ Updated user with Connect account details');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🏁 Test complete');
  }
}

// Run the test
testConnectAccount().catch(console.error);