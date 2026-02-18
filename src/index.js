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

  
// import {v2 as cloudinary} from 'cloudinary'
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const deleteAllImages = async () => {
//   try {
//     const result = await cloudinary.api.delete_all_resources({
//       resource_type: "image"
//     });

//     console.log("Deleted:", result);
//   } catch (error) {
//     console.error(error);
//   }
// };

// deleteAllImages();

