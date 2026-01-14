import express from "express";
import cors from "cors";
import adminRoute from "./routes/auth.routes.js";
import ItineraryRoute from "./routes/itinerary.auth.js";
import galleryRouter from "./routes/gallery.route.js";
import testimonialRouter from "./routes/testimonail.route.js";

const app = express();
app.use(express.json());
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());
app.use("/api/auth", adminRoute);
app.use("/api/itineraries", ItineraryRoute);
app.use("/api/gallery", galleryRouter);
app.use("/api/testimonials", testimonialRouter);

export default app;