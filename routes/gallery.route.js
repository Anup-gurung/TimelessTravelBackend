import express from "express";
import { 
  addGalleryEntry, 
  fetchAllGalleryEntries, 
  fetchGalleryEntryById, 
  modifyGalleryEntry, 
  removeGalleryEntry 
} from "../controllers/gallery.controller.js";
import upload from "../middleware/upload.js";

const galleryRouter = express.Router();

// Create new gallery entry with image
galleryRouter.post("/", upload.single("image"), addGalleryEntry);

// Retrieve all gallery entries
galleryRouter.get("/", fetchAllGalleryEntries);

// Retrieve specific gallery entry
galleryRouter.get("/:id", fetchGalleryEntryById);

// Update existing gallery entry
galleryRouter.put("/:id", upload.single("image"), modifyGalleryEntry);

// Remove gallery entry
galleryRouter.delete("/:id", removeGalleryEntry);

export default galleryRouter;
