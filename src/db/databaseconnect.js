import mongoose from "mongoose";
import dotenv from "dotenv";
import database from "../constants.js";

dotenv.config();

const DB_connect = async () => {
  try {
    if (!process.env.DB_URI) {
      throw new Error("DB_URI is missing");
    }

    await mongoose.connect(`${process.env.DB_URI}/${database}`);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.log("❌ Database is not connected:", error.message);
    throw error;
  }
};

export default DB_connect;
