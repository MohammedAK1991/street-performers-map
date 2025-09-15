// Test webhook for the specific pending payment
const paymentIntentId = 'pi_3S7ZQ6FO1izNNynG0M4MlX8x';

async function testCurrentPayment() {
  try {
    const webhookPayload = {
      id: 'evt_test_current_payment',
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
          latest_charge: 'ch_test_charge_current'
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_current',
        idempotency_key: null
      },
      type: 'payment_intent.succeeded'
    };

    console.log('🧪 Testing webhook for current payment:', paymentIntentId);

    const response = await fetch('http://localhost:3001/api/v1/payments/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (response.ok) {
      console.log('✅ Webhook processed successfully!');
      console.log('🔍 Check your database - transaction should now be completed');
    } else {
      const error = await response.text();
      console.log('❌ Webhook failed:', response.status, error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCurrentPayment();