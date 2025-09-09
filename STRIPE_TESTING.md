# 🧪 Stripe Testing in Production

## Test Cards for Production Testing

### Successful Payments
```
Card Number: 4242424242424242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Failed Payments (for testing error handling)
```
Declined Card: 4000000000000002
Insufficient Funds: 4000000000009995
Expired Card: 4000000000000069
```

## Stripe Connect Test Accounts

### Express Account Creation
When testing performer onboarding:
1. Use test SSN: `000-00-0000`
2. Use test EIN: `00-0000000`
3. Use test bank account: Routing `110000000`, Account `000123456789`
4. Use test address: Any US address works

### Testing Flow
1. **Create Performance** → Sign up as performer
2. **Onboard to Stripe** → Complete Express account setup
3. **Receive Tips** → Test tip payments from viewers
4. **Check Payouts** → Verify money flows to performer account

## Webhook Testing

### Test Webhook Locally
```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local backend
stripe listen --forward-to localhost:3001/api/v1/payments/webhook
```

### Production Webhook URL
Set this in Stripe Dashboard:
```
https://your-backend.railway.app/api/v1/payments/webhook
```

## Test Scenarios

### 1. Tip Payment Flow
- [ ] User sees performer on map
- [ ] User clicks tip button
- [ ] Payment form loads correctly
- [ ] Payment processes successfully
- [ ] Performer receives notification
- [ ] Database records transaction

### 2. Connect Account Setup
- [ ] Performer signs up
- [ ] Stripe Connect onboarding starts
- [ ] Account details collected
- [ ] Account gets approved (test mode)
- [ ] Performer can receive payments

### 3. Error Handling
- [ ] Test failed payment cards
- [ ] Network error scenarios
- [ ] Webhook failures
- [ ] Account restrictions

## Production Monitoring

### Check These Endpoints
- Health: `GET https://your-backend.railway.app/health`
- Payments: `POST https://your-backend.railway.app/api/v1/payments/tip`
- Connect: `POST https://your-backend.railway.app/api/v1/payments/connect/account`

### Stripe Dashboard
Monitor in Stripe Dashboard:
- Payment attempts
- Successful transactions
- Failed payments
- Webhook delivery status
- Connect account status