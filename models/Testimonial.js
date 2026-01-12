import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
  username: String,
  user_image: String,
  rating: Number,
  description: String,

  status: {
    type: String,
    enum: ["Pending", "Approved"],
    default: "Pending"
  },

  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Testimonial", testimonialSchema);
