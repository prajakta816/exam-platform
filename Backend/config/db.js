import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10s timeout
      socketTimeoutMS: 45000,
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("DB ERROR:", error.message);
    process.exit(1);
  }
};

export default connectDB;