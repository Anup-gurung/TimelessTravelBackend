import express from "express";
import {
  submitTestimonial,
  getApprovedTestimonials,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonialStatus,
  deleteTestimonial
} from "../controllers/testimonial.controller.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Public routes (for website users)
router.post("/submit", upload.single("user_image"), submitTestimonial);
router.get("/approved", getApprovedTestimonials);
router.get("/admin/all", getAllTestimonials);

// Admin routes (protected)
router.get("/admin/:id", verifyAdmin, getTestimonialById);
router.patch("/admin/:id/status", verifyAdmin, updateTestimonialStatus);
router.delete("/admin/:id", verifyAdmin, deleteTestimonial);

export default router;
