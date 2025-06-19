import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const dbUrl: string = process.env.DB_URL || "";

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("DB connected successfully!");
  } catch (error: any) {
    console.log("Database connection error:", error.message);
  }
};

export default connectDB;
