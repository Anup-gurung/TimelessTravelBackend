// routes/itinerary.routes.js
import express from "express";
import * as controller from "../controllers/itinerary.controller.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/",
  upload.fields([
    { name: "cover_image", maxCount: 1 }
  ]),
  controller.createItinerary
);
router.get("/", controller.getAllItineraries);
router.get("/:id", controller.getItineraryById);
router.put(
  "/:id",
  upload.fields([{ name: "cover_image", maxCount: 1 }]),
  controller.updateItinerary
);
router.delete("/:id", controller.deleteItinerary);

// Day-wise
router.post(
  "/:id/days",
  upload.fields([{ name: "images", maxCount: 10 }]),
  controller.addDay
);
router.put(
  "/:id/days/:dayId",
  upload.fields([{ name: "images", maxCount: 10 }]),
  controller.updateDay
);
router.delete("/:id/days/:dayId", controller.removeDay);
router.put(
  "/:id/days/reorder",
  upload.fields([{ name: "images", maxCount: 10 }]),
  controller.reorderDays
);

export default router;
