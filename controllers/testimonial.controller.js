import Testimonial from "../models/Testimonial.js";
import { v2 as cloudinary } from "cloudinary";

// Upload image to Cloudinary helper
const uploadToCloudinary = async (fileBuffer, mimeType) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const base64Image = Buffer.from(fileBuffer).toString("base64");
  const imageDataUri = `data:${mimeType};base64,${base64Image}`;
  
  const cloudinaryResponse = await cloudinary.uploader.upload(imageDataUri, {
    folder: "testimonials",
    resource_type: "auto",
    transformation: [{ quality: "auto", fetch_format: "auto" }]
  });
  
  return cloudinaryResponse.secure_url;
};

// POST - User submits testimonial (public route)
export const submitTestimonial = async (req, res) => {
  try {
    const { username, rating, description } = req.body;
    
    // Validation
    if (!username || !rating || !description) {
      return res.status(400).json({ 
        success: false,
        message: "Username, rating, and description are required" 
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        message: "Rating must be between 1 and 5" 
      });
    }

    // Upload image if provided
    let uploadedImageUrl = null;
    if (req.file) {
      uploadedImageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    }

    // Create testimonial with default "Pending" status
    const newTestimonial = await Testimonial.create({
      username: username.trim(),
      user_image: uploadedImageUrl,
      rating: Number(rating),
      description: description.trim(),
      status: "Pending"
    });

    res.status(201).json({
      success: true,
      message: "Testimonial submitted successfully. It will be reviewed by our team.",
      data: newTestimonial
    });
  } catch (err) {
    console.error("Testimonial submission error:", err);
    res.status(500).json({ 
      success: false,
      message: "Unable to submit testimonial",
      error: err.message 
    });
  }
};

// GET - Fetch approved testimonials (public route - for website display)
export const getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ status: "Approved" })
      .sort({ created_at: -1 })
      .lean();
    
    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (err) {
    console.error("Fetch approved testimonials error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET - Fetch all testimonials (admin route)
export const getAllTestimonials = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Build filter
    const filter = {};
    if (status && ["Pending", "Approved"].includes(status)) {
      filter.status = status;
    }

    const testimonials = await Testimonial.find(filter)
      .sort({ created_at: -1 })
      .lean();
    
    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (err) {
    console.error("Fetch all testimonials error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET - Fetch single testimonial by ID (admin route)
export const getTestimonialById = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findById(id);
    
    if (!testimonial) {
      return res.status(404).json({ 
        success: false,
        message: "Testimonial not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: testimonial
    });
  } catch (err) {
    console.error("Fetch testimonial by ID error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// PATCH - Update testimonial status (admin route)
export const updateTestimonialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!status || !["Pending", "Approved"].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Status must be either 'Pending' or 'Approved'" 
      });
    }

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!updatedTestimonial) {
      return res.status(404).json({ 
        success: false,
        message: "Testimonial not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Testimonial status updated to ${status}`,
      data: updatedTestimonial
    });
  } catch (err) {
    console.error("Update testimonial status error:", err);
    res.status(500).json({ 
      success: false,
      message: "Unable to update testimonial status",
      error: err.message 
    });
  }
};

// DELETE - Delete testimonial (admin route)
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedTestimonial = await Testimonial.findByIdAndDelete(id);
    
    if (!deletedTestimonial) {
      return res.status(404).json({ 
        success: false,
        message: "Testimonial not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully"
    });
  } catch (err) {
    console.error("Delete testimonial error:", err);
    res.status(500).json({ 
      success: false,
      message: "Unable to delete testimonial",
      error: err.message 
    });
  }
};
