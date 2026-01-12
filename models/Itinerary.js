import mongoose from "mongoose";

const DayImageSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true }
});

const ItineraryDaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  title: { type: String },
  description: { type: String, required: true },
  location: { type: String },
  images: [DayImageSchema]
});

const ItinerarySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    short_desc: { type: String },
    long_desc: { type: String },

    location: { type: String, required: true },

    // ✅ EITHER category OR tour_type
    category: {
      type: String,
      enum: ["Culture", "Festival"],
      required: function () {
        return !this.tour_type;
      }
    },

    tour_type: {
      type: String,
      enum: ["Trekking", "Walking", "Adventure"],
      required: function () {
        return !this.category;
      }
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true
    },

    pricing: {
      solo: { type: Number, required: true }, // 1 pax - solo travelers
      twoPax: { type: Number, required: true }, // 2 pax per person
      threeToFivePax: { type: Number, required: true }, // 3-5 pax per person
      sixToNinePax: { type: Number, required: true }, // 6-9 pax per person
      tenPaxAbove: { type: Number, required: true }, // 10+ pax per person
      tourCost: { type: Number, required: true } // Base tour cost
    },

    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },

    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Draft"
    },

    cover_image_url: { type: String },
    is_cover_img: { type: Boolean, default: false },

    itinerary_days: [ItineraryDaySchema]
  },
  { timestamps: true }
);

// Validation middleware to prevent base64 strings in itinerary_days
ItinerarySchema.pre('save', function() {
  if (this.itinerary_days && Array.isArray(this.itinerary_days)) {
    // Filter out any invalid entries (strings, null, undefined)
    this.itinerary_days = this.itinerary_days.filter(day => {
      if (!day || typeof day !== 'object') return false;
      if (typeof day === 'string') return false;
      if (!day.description) return false;
      return true;
    });
  }
});

export default mongoose.model("Itinerary", ItinerarySchema);
