// Directly complete the payment in development
const mongoose = require('mongoose');

const paymentIntentId = 'pi_3S7ZQ6FO1izNNynG0M4MlX8x';

async function completePayment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Define Transaction schema
    const transactionSchema = new mongoose.Schema({
      stripePaymentIntentId: String,
      status: String,
      payoutStatus: String,
    }, { collection: 'transactions' });

    const Transaction = mongoose.model('Transaction', transactionSchema);

    // Find the transaction
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntentId
    });

    if (!transaction) {
      console.log('❌ Transaction not found');
      return;
    }

    console.log('📄 Found transaction:', transaction._id);
    console.log('📄 Current status:', transaction.status);

    if (transaction.status === 'pending') {
      // Update status to completed
      await Transaction.updateOne(
        { _id: transaction._id },
        {
          status: 'completed',
          payoutStatus: 'completed',
          updatedAt: new Date()
        }
      );

      console.log('✅ Transaction updated to completed!');
    } else {
      console.log('ℹ️ Transaction already has status:', transaction.status);
    }

    await mongoose.disconnect();
    console.log('✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

completePayment();