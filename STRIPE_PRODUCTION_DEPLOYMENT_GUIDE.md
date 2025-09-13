# 🚀 Stripe Production Deployment Guide

This guide will walk you through setting up Stripe payments in production for StreetPerformersMap.

## ✅ Code Changes Made

I've updated your codebase to support real Stripe payments:

### Backend Changes:
- **User Model**: Added Stripe Connect fields to store account information
- **PaymentController**: Now saves/retrieves real Stripe account IDs from database
- **StripeService**: Removed all mock/test code, requires real Stripe credentials
- **Webhook Handler**: Enhanced to handle Connect account updates

### Frontend Changes:
- **StripeConnectStep**: Now calls real API to create Stripe Connect accounts
- **TipModal**: Updated to handle production vs development payment flows

## 📋 Pre-Deployment Checklist

### 1. Stripe Account Setup
- [ ] Create Stripe account at https://stripe.com
- [ ] Complete business verification
- [ ] Enable Stripe Connect in your dashboard
- [ ] Configure your platform settings

### 2. Get Your Stripe Keys
- [ ] **Publishable Key** (starts with `pk_live_`)
- [ ] **Secret Key** (starts with `sk_live_`) 
- [ ] **Webhook Secret** (starts with `whsec_`)

### 3. Database Migration
Your database needs to be updated to support the new Stripe fields. Run this after deployment:

```javascript
// MongoDB migration script
db.users.updateMany(
  {},
  {
    $set: {
      "stripe.accountStatus": "pending",
      "stripe.detailsSubmitted": false,
      "stripe.chargesEnabled": false,
      "stripe.payoutsEnabled": false
    }
  }
)
```

## 🔧 Environment Variables Setup

### Backend Environment Variables (.env)
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here

# Frontend URL (for Stripe Connect redirects)
FRONTEND_URL=https://your-production-domain.com
```

### Frontend Environment Variables 
```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_publishable_key_here
```

## 🔗 Stripe Dashboard Configuration

### 1. Webhook Endpoints
Set up webhooks in your Stripe Dashboard:

**Webhook URL**: `https://your-backend-domain.com/api/v1/payments/webhook`

**Events to Enable**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed` 
- `payment_intent.canceled`
- `account.updated`

### 2. Connect Settings
Configure your Connect platform:
- **Platform name**: "StreetPerformersMap" 
- **Support email**: Your support email
- **Redirect URIs**: 
  - `https://your-domain.com/connect/return`
  - `https://your-domain.com/connect/refresh`

## 🧪 Testing in Production

### Step 1: Test Stripe Connect Onboarding

1. **Sign up as a performer** on your production site
2. **Complete onboarding** - you should be redirected to real Stripe Express
3. **Use test data** for verification:
   - SSN: `000-00-0000`
   - Bank: Routing `110000000`, Account `000123456789`  
   - Address: Any valid US address
4. **Verify in database** - check user has `stripe.connectAccountId`
5. **Check Stripe Dashboard** - confirm account appears in Connect → Accounts

### Step 2: Test Tip Payments

1. **Create a performance** as the connected performer
2. **Find it on the map** as a different user
3. **Click tip button** and use test card `4242424242424242`
4. **Verify payment processing**:
   - Check Stripe Dashboard → Payments
   - Check your database for transaction record
   - Confirm webhook delivery in Stripe Dashboard

### Step 3: Verify Webhook Delivery

1. Go to **Stripe Dashboard → Webhooks**
2. Check **Recent deliveries** tab
3. Ensure all webhook events are delivering successfully
4. Check your server logs for webhook processing

## 🚨 Common Issues & Solutions

### Issue: "Stripe not configured" errors
**Solution**: Verify all environment variables are set correctly and restart your backend

### Issue: Webhooks failing
**Solutions**:
- Ensure webhook URL is publicly accessible  
- Check webhook secret matches exactly
- Verify your server can receive POST requests
- Check server logs for error details

### Issue: Connect account creation fails
**Solutions**:
- Verify Connect is enabled in Stripe Dashboard
- Check redirect URLs are configured correctly
- Ensure business verification is complete

### Issue: Payments failing
**Solutions**:
- Verify publishable key is correct in frontend
- Check Stripe Dashboard for specific error messages
- Ensure Connect accounts are fully verified

## 📊 Production Monitoring

### Key Metrics to Monitor:
- **Payment Success Rate**: Monitor in Stripe Dashboard
- **Webhook Delivery Success**: Check webhook endpoints regularly  
- **Connect Account Status**: Monitor onboarding completion rates
- **Transaction Volume**: Track total payment volume

### Alerts to Set Up:
- Failed webhook deliveries
- High payment failure rates
- Connect account issues
- Unusual transaction patterns

## 🔐 Security Checklist

- [ ] Never log Stripe secrets to console/files
- [ ] Use HTTPS everywhere
- [ ] Validate webhook signatures
- [ ] Implement rate limiting on payment endpoints
- [ ] Monitor for suspicious payment patterns
- [ ] Regular security audits of payment flows

## 📞 Support & Documentation

- **Stripe Connect Guide**: https://stripe.com/docs/connect
- **Webhook Guide**: https://stripe.com/docs/webhooks
- **Test Cards**: https://stripe.com/docs/testing#cards
- **Stripe Support**: Available through your Dashboard

## 🚀 Deployment Commands

After updating environment variables, deploy with:

```bash
# Build shared types
pnpm --filter @spm/shared-types build

# Build backend  
pnpm --filter @spm/backend build

# Build frontend
pnpm --filter @spm/frontend build

# Deploy to your platform (Railway, Heroku, etc.)
# Follow your platform's deployment process
```

## ✅ Go-Live Verification

Before going live, verify:
- [ ] All environment variables set correctly
- [ ] Webhooks receiving events successfully  
- [ ] Connect onboarding flow working end-to-end
- [ ] Test payments processing correctly
- [ ] Database storing transaction records
- [ ] Connect accounts saving to user profiles
- [ ] Error handling working for failed payments

---

**🎉 You're ready for production!** 

Your Stripe integration now supports:
- ✅ Real Stripe Connect account creation
- ✅ Real payment processing  
- ✅ Webhook event handling
- ✅ Connect account status synchronization
- ✅ Production-ready error handling

Test thoroughly and monitor closely during initial launch.