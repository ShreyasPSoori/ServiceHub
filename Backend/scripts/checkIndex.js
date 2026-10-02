const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Booking = require('../models/Booking');

async function checkIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Explicitly sync indexes (forces index creation in case it's not created immediately)
    await Booking.syncIndexes();
    
    // List indexes
    const indexes = await Booking.collection.indexes();
    console.log('Current Booking Indexes:', JSON.stringify(indexes, null, 2));
    
    const hasCompound = indexes.some(idx => 
      idx.key.providerId === 1 && 
      idx.key.bookingDate === 1 && 
      idx.key.status === 1
    );
    
    if (hasCompound) {
      console.log('[PASS] Compound index successfully created on Booking collection.');
    } else {
      console.log('[FAIL] Compound index not found.');
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

checkIndex();
