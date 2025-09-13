# Backend Tests

This directory contains integration tests for the StreetPerformersMap backend.

## Integration Tests

Located in `tests/integration/`:

### Stripe Integration Tests

- **`stripe-connect-debug.js`** - Debug tool for Stripe Connect setup
- **`stripe-connect.test.js`** - Test Stripe Connect account creation
- **`stripe-basic-tip.test.js`** - Test basic tip payment flow
- **`stripe-tip-flow.test.js`** - Test complete tip flow with Connect transfers

## Running Tests

### Prerequisites
- MongoDB connection configured in `.env`
- Stripe keys configured in `.env`

### Run Individual Tests

```bash
# Debug Stripe Connect setup
NODE_ENV=production node -r dotenv/config tests/integration/stripe-connect-debug.js

# Test Connect account creation
NODE_ENV=production node -r dotenv/config tests/integration/stripe-connect.test.js

# Test basic tip payments
NODE_ENV=production node -r dotenv/config tests/integration/stripe-basic-tip.test.js

# Test complete tip flow
NODE_ENV=production node -r dotenv/config tests/integration/stripe-tip-flow.test.js
```

### Environment Notes

- Use `NODE_ENV=production` for real Stripe API calls
- Use `NODE_ENV=development` for mock responses
- All tests use Stripe test mode (test keys)

## Test Data

Tests create temporary test users and performances that can be cleaned up manually from MongoDB if needed.

Test accounts created:
- `testperformer@example.com`
- `testtipper@example.com`