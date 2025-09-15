// Test webhook flow by manually triggering payment completion
const paymentIntentId = 'pi_3S7ZQ6FO1izNNynG0M4MlX8x';

console.log('🧪 Testing webhook flow for payment:', paymentIntentId);

async function testWebhookFlow() {
  try {
    // Simulate a successful payment webhook event
    const webhookEvent = {
      id: 'evt_test_webhook',
      object: 'event',
      api_version: '2025-08-27.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: paymentIntentId,
          object: 'payment_intent',
          amount: 400,
          currency: 'eur',
          status: 'succeeded',
          metadata: {
            type: 'tip',
            performanceId: '68c7e6c7fbf25b85ec1a1f1e',
            performerId: '68c16713ae8b53c068d8f31f',
            tipperId: '68c16713ae8b53c068d8f31f',
            isAnonymous: 'false',
            publicMessage: '',
            processingFee: '42',
            netAmount: '358'
          },
          latest_charge: 'ch_test_charge_123'
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_request',
        idempotency_key: null
      },
      type: 'payment_intent.succeeded'
    };

    // Send POST request to our webhook endpoint
    const response = await fetch('http://localhost:3001/api/v1/payments/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature' // Will be handled as development mode
      },
      body: JSON.stringify(webhookEvent)
    });

    if (response.ok) {
      console.log('✅ Webhook processed successfully!');
      console.log('Status:', response.status);

      // Check if transaction was updated
      console.log('🔍 Check your database - the transaction should now be "completed"');
    } else {
      const error = await response.text();
      console.log('❌ Webhook failed:', response.status, error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWebhookFlow();