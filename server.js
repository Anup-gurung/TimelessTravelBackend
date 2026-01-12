import dotenv from "dotenv";
dotenv.config(); // ✅ MUST BE FIRST LINE

import "./config/cloudinary.js"; // ✅ AFTER dotenv

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
