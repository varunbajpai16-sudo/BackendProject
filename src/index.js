import dotenv from "dotenv";
import connectDB from "./db/databaseconnect.js";
import express from "express";
const app = express();
dotenv.config();

connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
