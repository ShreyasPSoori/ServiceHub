const mongoose = require('mongoose');
require('dotenv').config();

async function testTransaction() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const session = await mongoose.startSession();
    session.startTransaction();
    console.log('Transaction started successfully. Replica set is supported!');
    
    await session.abortTransaction();
    session.endSession();
  } catch (err) {
    console.error('Transaction support error:', err.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}
testTransaction();
