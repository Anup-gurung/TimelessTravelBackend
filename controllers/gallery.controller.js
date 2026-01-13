import Gallery from "../models/Gallery.js";
import { v2 as cloudinary } from "cloudinary";

// Upload image to Cloudinary helper
const uploadToCloudinary = async (fileBuffer, mimeType) => {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const base64Image = Buffer.from(fileBuffer).toString("base64");
  const imageDataUri = `data:${mimeType};base64,${base64Image}`;
  
  const cloudinaryResponse = await cloudinary.uploader.upload(imageDataUri, {
    folder: "gallery",
    resource_type: "auto",
    transformation: [{ quality: "auto", fetch_format: "auto" }]
  });
  
  return cloudinaryResponse.secure_url;
};

// POST - Add new gallery entry
export const addGalleryEntry = async (req, res) => {
  try {
    const { place_name } = req.body;

    let uploadedImageUrl = null;
    if (req.file) {
      uploadedImageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    }

    const newEntry = await Gallery.create({
      image_url: uploadedImageUrl,
      place_name: place_name
    });

    res.status(201).json({
      success: true,
      data: newEntry
    });
  } catch (err) {
    console.error("Gallery add error:", err);
    res.status(500).json({ 
      success: false,
      message: "Unable to add gallery entry",
      error: err.message 
    });
  }
};

// GET - Fetch all gallery entries
export const fetchAllGalleryEntries = async (req, res) => {
  try {
    const galleryList = await Gallery.find()
      .sort({ created_at: -1 })
      .lean();
    
    res.status(200).json({
      success: true,
      count: galleryList.length,
      data: galleryList
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET - Fetch single gallery entry by ID
export const fetchGalleryEntryById = async (req, res) => {
  try {
    const entryId = req.params.id;
    const galleryEntry = await Gallery.findById(entryId);
    
    if (!galleryEntry) {
      return res.status(404).json({ 
        success: false,
        message: "Gallery entry not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: galleryEntry
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// PUT - Modify existing gallery entry
export const modifyGalleryEntry = async (req, res) => {
  try {
    const entryId = req.params.id;
    const existingEntry = await Gallery.findById(entryId);
    
    if (!existingEntry) {
      return res.status(404).json({ 
        success: false,
        message: "Gallery entry not found" 
      });
    }

    // Handle new image upload
    if (req.file) {
      const newImageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      existingEntry.image_url = newImageUrl;
    }

    // Update place name if provided
    if (req.body.place_name) {
      existingEntry.place_name = req.body.place_name;
    }

    const updatedEntry = await existingEntry.save();
    
    res.status(200).json({
      success: true,
      data: updatedEntry
    });
  } catch (err) {
    console.error("Gallery modify error:", err);
    res.status(500).json({ 
      success: false,
      message: "Unable to modify gallery entry",
      error: err.message 
    });
  }
};

// DELETE - Remove gallery entry
export const removeGalleryEntry = async (req, res) => {
  try {
    const entryId = req.params.id;
    const deletedEntry = await Gallery.findByIdAndDelete(entryId);
    
    if (!deletedEntry) {
      return res.status(404).json({ 
        success: false,
        message: "Gallery entry not found" 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: "Gallery entry removed successfully"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};
