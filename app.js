
import express from "express";
import cors from "cors";

import adminRoute from "./routes/auth.routes.js";
import ItineraryRoute from "./routes/itinerary.auth.js";
import galleryRouter from "./routes/gallery.route.js";
import testimonialRouter from "./routes/testimonail.route.js";

const app = express();
app.use(express.json());

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://timeless-travel-admin-frontend.vercel.app",
  "https://www.timelessbhutantravels.com",
];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ DO NOT leave this as cors()

app.use("/api/auth", adminRoute);
app.use("/api/itineraries", ItineraryRoute);
app.use("/api/gallery", galleryRouter);
app.use("/api/testimonials", testimonialRouter);

export default app;
