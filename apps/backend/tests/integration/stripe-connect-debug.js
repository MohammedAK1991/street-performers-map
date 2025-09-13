#!/usr/bin/env node
/**
 * Stripe Connect Debug Script
 * 
 * This script helps investigate Stripe Connect account issues by:
 * 1. Listing existing Connect accounts
 * 2. Checking platform configuration
 * 3. Testing account creation
 */

const Stripe = require('stripe');

// Load Stripe credentials from environment or hardcode for testing
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is required');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function debugStripeConnect() {
  console.log('🔍 Stripe Connect Debug Tool');
  console.log('============================\n');

  try {
    // 1. Check platform account details
    console.log('1️⃣ Checking platform account...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Platform Account Details:');
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Type: ${account.type}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Business Type: ${account.business_type || 'N/A'}`);
    console.log(`   Charges Enabled: ${account.charges_enabled}`);
    console.log(`   Payouts Enabled: ${account.payouts_enabled}`);
    console.log(`   Details Submitted: ${account.details_submitted}`);
    
    // Check if Connect is enabled
    if (account.capabilities) {
      console.log('   Capabilities:');
      Object.entries(account.capabilities).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    }
    console.log('');

    // 2. List existing Connect accounts
    console.log('2️⃣ Listing existing Connect accounts...');
    const connectAccounts = await stripe.accounts.list({ limit: 10 });
    
    if (connectAccounts.data.length === 0) {
      console.log('   No Connect accounts found');
    } else {
      console.log(`   Found ${connectAccounts.data.length} Connect account(s):`);
      connectAccounts.data.forEach((acc, index) => {
        console.log(`   ${index + 1}. ${acc.id} (${acc.type}) - ${acc.email || 'No email'}`);
        console.log(`      Country: ${acc.country}, Charges: ${acc.charges_enabled}, Payouts: ${acc.payouts_enabled}`);
      });
    }
    console.log('');

    // 3. Test creating a new Express account
    console.log('3️⃣ Testing Express account creation...');
    try {
      const testAccount = await stripe.accounts.create({
        type: 'express',
        country: 'ES', // Spain as an example
        email: 'test@example.com'
      });
      
      console.log('✅ Successfully created test Express account:');
      console.log(`   Account ID: ${testAccount.id}`);
      console.log(`   Type: ${testAccount.type}`);
      console.log(`   Country: ${testAccount.country}`);
      console.log(`   Email: ${testAccount.email || 'N/A'}`);
      
      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: testAccount.id,
        refresh_url: 'http://localhost:3000/connect/refresh',
        return_url: 'http://localhost:3000/connect/return',
        type: 'account_onboarding',
      });
      
      console.log(`   Onboarding URL: ${accountLink.url}`);
      
      // Clean up: Delete the test account
      await stripe.accounts.del(testAccount.id);
      console.log('   Test account deleted successfully');
      
    } catch (createError) {
      console.log('❌ Failed to create Express account:');
      console.log(`   Error: ${createError.message}`);
      console.log(`   Code: ${createError.code || 'N/A'}`);
      console.log(`   Type: ${createError.type || 'N/A'}`);
      
      if (createError.message.includes('not eligible')) {
        console.log('\n💡 Possible solutions:');
        console.log('   - Verify your Stripe account is fully activated');
        console.log('   - Check if Connect is enabled in your Stripe dashboard');
        console.log('   - Ensure your platform account meets Stripe\'s requirements');
      }
    }
    console.log('');

    // 4. Check if there are any webhook endpoints configured
    console.log('4️⃣ Checking webhook endpoints...');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 5 });
    
    if (webhooks.data.length === 0) {
      console.log('   No webhook endpoints found');
    } else {
      console.log(`   Found ${webhooks.data.length} webhook endpoint(s):`);
      webhooks.data.forEach((webhook, index) => {
        console.log(`   ${index + 1}. ${webhook.url}`);
        console.log(`      Status: ${webhook.status}`);
        console.log(`      Events: ${webhook.enabled_events.join(', ')}`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    
    if (error.code === 'invalid_request_error' && error.message.includes('No such')) {
      console.log('\n💡 This might indicate API key issues or account access problems');
    }
  }
}

// Run the debug script
debugStripeConnect().then(() => {
  console.log('\n🏁 Debug complete');
}).catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});