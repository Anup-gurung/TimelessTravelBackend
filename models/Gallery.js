import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema({
  image_url: String,
  place_name: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Gallery", gallerySchema);
