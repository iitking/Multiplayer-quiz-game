import mongoose from 'mongoose';

let isMongoConnected = false;

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.log('ℹ️ No MONGO_URI provided in .env. Using built-in persistent storage for Quizzes, Users & History.');
    isMongoConnected = false;
    return false;
  }

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB Atlas/Database successfully');
    return true;
  } catch (err) {
    console.warn('⚠️ MongoDB connection failed:', err.message, 'Falling back to local persistent store.');
    isMongoConnected = false;
    return false;
  }
}

export function getIsMongoConnected() {
  return isMongoConnected;
}
