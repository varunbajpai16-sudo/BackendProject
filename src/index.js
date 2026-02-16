import dotenv from "dotenv";
dotenv.config(); 
import connectDB from "./db/databaseconnect.js";
import app from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });

