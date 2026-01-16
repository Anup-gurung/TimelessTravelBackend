import Itinerary from "../models/Itinerary.js";
import { v2 as cloudinary } from "cloudinary";

export const createItinerary = async (req, res) => {
  try {
    let cover_image_url = null;

    // Upload cover image to Cloudinary if provided
    if (req.files && req.files.cover_image && req.files.cover_image[0]) {
      const file = req.files.cover_image[0];
      
      // Configure Cloudinary with environment variables
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      
      // Convert buffer to base64
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      
      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: "itineraries",
        resource_type: "auto"
      });
      
      cover_image_url = uploadResult.secure_url;
    }

    // Parse pricing_tiers from JSON string (FormData sends objects as strings)
    let pricingTiers = [];
    if (req.body.pricing_tiers) {
      try {
        pricingTiers = typeof req.body.pricing_tiers === 'string' 
          ? JSON.parse(req.body.pricing_tiers) 
          : req.body.pricing_tiers;
      } catch (e) {
        console.error("Failed to parse pricing_tiers:", e);
      }
    }

    // Map pricing_tiers array to pricing object structure
    const pricing = {
      solo: 0,
      twoPax: 0,
      threeToFivePax: 0,
      sixToNinePax: 0,
      tenPaxAbove: 0,
      tourCost: Number(req.body.price || 0)
    };

    pricingTiers.forEach(tier => {
      if (tier.min_pax === 1 && tier.max_pax === 1) {
        pricing.solo = Number(tier.price_per_person);
      } else if (tier.min_pax === 2 && tier.max_pax === 2) {
        pricing.twoPax = Number(tier.price_per_person);
      } else if (tier.min_pax === 3 && tier.max_pax === 5) {
        pricing.threeToFivePax = Number(tier.price_per_person);
      } else if (tier.min_pax === 6 && tier.max_pax === 9) {
        pricing.sixToNinePax = Number(tier.price_per_person);
      } else if (tier.min_pax === 10 && tier.max_pax === null) {
        pricing.tenPaxAbove = Number(tier.price_per_person);
      }
    });

    // Build itinerary object conditionally
    const itineraryData = {
      title: req.body.title,
      short_desc: req.body.short_desc,
      long_desc: req.body.long_desc,
      location: req.body.location,
      difficulty: req.body.difficulty,
      pricing: pricing,
      cover_image_url: cover_image_url,
      is_cover_img: req.body.is_cover_img === 'true'
    };

    // Only set dates if provided
    if (req.body.start_date) {
      itineraryData.start_date = new Date(req.body.start_date);
    }
    if (req.body.end_date) {
      itineraryData.end_date = new Date(req.body.end_date);
    }

    // Only set category OR tour_type, not both
    if (req.body.category) {
      itineraryData.category = req.body.category;
    } else if (req.body.tour_type) {
      itineraryData.tour_type = req.body.tour_type;
    }

    const itinerary = new Itinerary(itineraryData);

    await itinerary.save();
    res.status(201).json(itinerary);
  } catch (err) {
    console.error("Create itinerary error:", err);
    res.status(400).json({
      message: "Failed to create itinerary",
      error: err.message
    });
  }
};


export const getAllItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.find().sort({ createdAt: -1 });
    res.json(itineraries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getItineraryById = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ message: "Not found" });
    res.json(itinerary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    // Handle cover image upload if new file provided
    if (req.files && req.files.cover_image && req.files.cover_image[0]) {
      const file = req.files.cover_image[0];
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: "itineraries",
        resource_type: "auto"
      });
      
      itinerary.cover_image_url = uploadResult.secure_url;
    }

    // Update basic fields if provided
    if (req.body.title !== undefined) itinerary.title = req.body.title;
    if (req.body.short_desc !== undefined) itinerary.short_desc = req.body.short_desc;
    if (req.body.long_desc !== undefined) itinerary.long_desc = req.body.long_desc;
    if (req.body.location !== undefined) itinerary.location = req.body.location;
    if (req.body.difficulty !== undefined) itinerary.difficulty = req.body.difficulty;
    if (req.body.status !== undefined) itinerary.status = req.body.status;
    if (req.body.is_cover_img !== undefined) itinerary.is_cover_img = req.body.is_cover_img === 'true';

    // Handle category/tour_type (mutually exclusive)
    if (req.body.category !== undefined) {
      itinerary.category = req.body.category || null;
      itinerary.tour_type = null;
    }
    if (req.body.tour_type !== undefined) {
      itinerary.tour_type = req.body.tour_type || null;
      itinerary.category = null;
    }

    // Handle pricing fields from pricing_tiers array
    if (req.body.pricing_tiers !== undefined) {
      let pricingTiers = [];
      try {
        pricingTiers = typeof req.body.pricing_tiers === 'string' 
          ? JSON.parse(req.body.pricing_tiers) 
          : req.body.pricing_tiers;
      } catch (e) {
        console.error("Failed to parse pricing_tiers:", e);
      }

      // Map pricing_tiers array to pricing object structure
      const pricing = {
        solo: itinerary.pricing?.solo || 0,
        twoPax: itinerary.pricing?.twoPax || 0,
        threeToFivePax: itinerary.pricing?.threeToFivePax || 0,
        sixToNinePax: itinerary.pricing?.sixToNinePax || 0,
        tenPaxAbove: itinerary.pricing?.tenPaxAbove || 0,
        tourCost: req.body.price ? Number(req.body.price) : (itinerary.pricing?.tourCost || 0)
      };

      pricingTiers.forEach(tier => {
        if (tier.min_pax === 1 && tier.max_pax === 1) {
          pricing.solo = Number(tier.price_per_person);
        } else if (tier.min_pax === 2 && tier.max_pax === 2) {
          pricing.twoPax = Number(tier.price_per_person);
        } else if (tier.min_pax === 3 && tier.max_pax === 5) {
          pricing.threeToFivePax = Number(tier.price_per_person);
        } else if (tier.min_pax === 6 && tier.max_pax === 9) {
          pricing.sixToNinePax = Number(tier.price_per_person);
        } else if (tier.min_pax === 10 && tier.max_pax === null) {
          pricing.tenPaxAbove = Number(tier.price_per_person);
        }
      });

      itinerary.pricing = pricing;
    }

    // Handle date fields
    if (req.body.start_date !== undefined) {
      itinerary.start_date = new Date(req.body.start_date);
    }
    if (req.body.end_date !== undefined) {
      itinerary.end_date = new Date(req.body.end_date);
    }

    await itinerary.save();
    res.json(itinerary);
  } catch (err) {
    console.error("Update itinerary error:", err);
    res.status(500).json({ 
      error: "Failed to update itinerary",
      details: err.message 
    });
  }
};

export const deleteItinerary = async (req, res) => {
  try {
    await Itinerary.findByIdAndDelete(req.params.id);
    res.json({ message: "Itinerary deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Day-wise builder (embedded)
export const addDay = async (req, res) => {
  try {
    // 1. Validate itinerary exists
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ error: "Itinerary not found" });
    }
    
    // 2. Validate required field
    if (!req.body.description) {
      return res.status(400).json({ 
        error: "Description is required for adding a day" 
      });
    }


    
    let finalImages = [];
    
    // 3. Upload file images to Cloudinary if provided via multipart/form-data
    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images) 
        ? req.files.images 
        : [req.files.images];
      
      for (const file of imageFiles) {
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: "itineraries/days",
          resource_type: "auto"
        });
        
        finalImages.push({ imageUrl: uploadResult.secure_url });
      }
    }

    // 4. Process body images if no file uploads
    if (finalImages.length === 0 && req.body.images) {
      let parsedImages = [];
      
      // Parse if it's a JSON string
      if (typeof req.body.images === 'string') {
        try {
          parsedImages = JSON.parse(req.body.images);
          
          // Validate it's an array
          if (!Array.isArray(parsedImages)) {
            return res.status(400).json({ 
              error: "Images must be an array. Received: " + typeof parsedImages 
            });
          }
        } catch (e) {
          return res.status(400).json({ 
            error: "Failed to parse images JSON: " + e.message 
          });
        }
      } else if (Array.isArray(req.body.images)) {
        parsedImages = req.body.images;
      } else {
        return res.status(400).json({ 
          error: "Images must be an array or JSON string" 
        });
      }

      // 5. Process each image in the array
      for (const img of parsedImages) {
        if (typeof img === 'string') {
          // Check if it's a base64 data URI
          if (img.startsWith('data:image/')) {
            try {
              const uploadResult = await cloudinary.uploader.upload(img, {
                folder: "itineraries/days",
                resource_type: "auto"
              });
              finalImages.push({ imageUrl: uploadResult.secure_url });
            } catch (uploadErr) {
              console.error('Cloudinary upload error:', uploadErr);
              return res.status(500).json({ 
                error: "Failed to upload base64 image to Cloudinary" 
              });
            }
          } else {
            // It's a regular URL string
            finalImages.push({ imageUrl: img });
          }
        } else if (img && typeof img === 'object' && img.imageUrl) {
          // It's already in correct format { imageUrl: "..." }
          if (img.imageUrl.startsWith('data:image/')) {
            // Upload base64 to Cloudinary
            try {
              const uploadResult = await cloudinary.uploader.upload(img.imageUrl, {
                folder: "itineraries/days",
                resource_type: "auto"
              });
              finalImages.push({ imageUrl: uploadResult.secure_url });
            } catch (uploadErr) {
              console.error('Cloudinary upload error:', uploadErr);
              return res.status(500).json({ 
                error: "Failed to upload base64 image to Cloudinary" 
              });
            }
          } else {
            finalImages.push({ imageUrl: img.imageUrl });
          }
        }
      }
    }

    // 6. Ensure finalImages is always an array before pushing to MongoDB
    if (!Array.isArray(finalImages)) {
      finalImages = [];
    }

    // 7. Create the day object
    const newDay = {
      dayNumber: req.body.day_number || itinerary.itinerary_days.length + 1,
      title: req.body.title || '',
      description: req.body.description,
      location: req.body.location || '',
      images: finalImages
    };

    // 8. Push to itinerary_days array
    itinerary.itinerary_days.push(newDay);

    // 9. Save to database
    await itinerary.save();
    
    res.status(201).json(itinerary);
  } catch (err) {
    console.error("Add day error:", err);
    res.status(500).json({ 
      error: "Failed to add day",
      details: err.message 
    });
  }
};

/**
 * Update an existing day in an itinerary
 * 
 * @route PUT /api/itineraries/:id/days/:dayId
 * 
 * IMAGE UPDATE CONTRACT:
 * - req.body.keep_images: JSON array (or array) of Cloudinary URLs to retain
 * - req.body.remove_images: JSON array (or array) of Cloudinary URLs to delete
 * - req.files.images: optional new image files to upload and append
 * 
 * RULES:
 * 1. Base64 images are NOT allowed - returns 400 error
 * 2. Start with keep_images (validated http/https URLs only)
 * 3. Remove any URLs listed in remove_images
 * 4. Upload and append new files from req.files.images
 * 5. If no image parameters provided, keep existing images unchanged
 * 6. Allow partial updates (title, description, location) without touching images
 */
export const updateDay = async (req, res) => {
  try {
    // 1. Find itinerary
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    // 2. Find specific day
    const dayToUpdate = itinerary.itinerary_days.id(req.params.dayId);
    if (!dayToUpdate) {
      return res.status(404).json({ error: "Day not found" });
    }

    // 3. Helper function to parse JSON safely
    const parseJsonSafely = (value, fieldName) => {
      if (!value) return null;
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error(`${fieldName} must be an array`);
          }
          return parsed;
        } catch (e) {
          throw new Error(`Invalid JSON in ${fieldName}: ${e.message}`);
        }
      }
      throw new Error(`${fieldName} must be an array or JSON string`);
    };

    // 4. Helper function to validate URL
    const isValidUrl = (str) => {
      if (typeof str !== 'string') return false;
      return str.startsWith('http://') || str.startsWith('https://');
    };

    // 5. Check for base64 images (NOT ALLOWED)
    const checkForBase64 = (data) => {
      if (!data) return false;
      if (typeof data === 'string' && data.startsWith('data:image/')) return true;
      if (Array.isArray(data)) {
        return data.some(item => {
          if (typeof item === 'string' && item.startsWith('data:image/')) return true;
          if (item && typeof item === 'object' && item.imageUrl && item.imageUrl.startsWith('data:image/')) return true;
          return false;
        });
      }
      return false;
    };

    // Check all possible sources for base64
    if (checkForBase64(req.body.keep_images) || 
        checkForBase64(req.body.remove_images) ||
        checkForBase64(req.body.images)) {
      return res.status(400).json({
        error: "Base64 images are not allowed in updateDay",
        message: "Please upload images as files or provide Cloudinary URLs only"
      });
    }

    // 6. Parse keep_images and remove_images
    let keepImages = null;
    let removeImages = null;

    try {
      if (req.body.keep_images !== undefined) {
        keepImages = parseJsonSafely(req.body.keep_images, 'keep_images');
      }
      if (req.body.remove_images !== undefined) {
        removeImages = parseJsonSafely(req.body.remove_images, 'remove_images');
      }
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    // 7. Determine if we should update images
    const shouldUpdateImages = keepImages !== null || 
                               removeImages !== null || 
                               (req.files && req.files.images);

    let finalImages = [];

    if (shouldUpdateImages) {
      // 8. Start with keep_images (validate URLs)
      if (keepImages && keepImages.length > 0) {
        for (const url of keepImages) {
          if (!isValidUrl(url)) {
            return res.status(400).json({
              error: `Invalid URL in keep_images: ${url}`,
              message: "Only http:// or https:// URLs are allowed"
            });
          }
          finalImages.push(url);
        }
      }

      // 9. Remove URLs listed in remove_images
      if (removeImages && removeImages.length > 0) {
        // Validate remove_images URLs
        for (const url of removeImages) {
          if (!isValidUrl(url)) {
            return res.status(400).json({
              error: `Invalid URL in remove_images: ${url}`,
              message: "Only http:// or https:// URLs are allowed"
            });
          }
        }
        // Filter out removed images
        finalImages = finalImages.filter(url => !removeImages.includes(url));
      }

      // 10. Upload new files and append to finalImages
      if (req.files && req.files.images) {
        const imageFiles = Array.isArray(req.files.images)
          ? req.files.images
          : [req.files.images];

        for (const file of imageFiles) {
          try {
            const b64 = Buffer.from(file.buffer).toString("base64");
            const dataURI = `data:${file.mimetype};base64,${b64}`;

            const uploadResult = await cloudinary.uploader.upload(dataURI, {
              folder: "itineraries/days",
              resource_type: "auto"
            });

            finalImages.push(uploadResult.secure_url);
          } catch (uploadErr) {
            console.error("Cloudinary upload error:", uploadErr);
            return res.status(500).json({
              error: "Failed to upload image to Cloudinary",
              details: uploadErr.message
            });
          }
        }
      }

      // 11. Set images ONLY ONCE in the correct format
      dayToUpdate.images = finalImages.map(url => ({ imageUrl: url }));
    }

    // 12. Update other fields (allow partial updates)
    if (req.body.title !== undefined) {
      dayToUpdate.title = req.body.title;
    }
    if (req.body.description !== undefined) {
      dayToUpdate.description = req.body.description;
    }
    if (req.body.location !== undefined) {
      dayToUpdate.location = req.body.location;
    }

    // 13. Save to database
    await itinerary.save();

    // 14. Return success response
    res.json({
      success: true,
      day: dayToUpdate,
      images: dayToUpdate.images,
      message: "Day updated successfully"
    });

  } catch (err) {
    console.error("Update day error:", err);
    res.status(500).json({
      error: "Failed to update day",
      details: err.message
    });
  }
};

export const removeDay = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    itinerary.itinerary_days = itinerary.itinerary_days.filter(
      (day) => day._id.toString() !== req.params.dayId
    );

    // Re-order day numbers
    itinerary.itinerary_days.forEach((day, index) => {
      day.dayNumber = index + 1;
    });

    await itinerary.save();
    res.json(itinerary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Reorder itinerary days
 * 
 * @route PUT /api/itineraries/:id/days/reorder
 * 
 * @body {
 *   days: Array<{
 *     _id: string,              // Required - MongoDB ObjectId
 *     title: string,            // Optional
 *     description: string,      // Required
 *     location: string,         // Optional
 *     images: Array<{           // Optional - Array of image objects
 *       imageUrl: string        // Cloudinary URL (NOT base64)
 *     }>
 *   }>
 * }
 * 
 * ⚠️ IMPORTANT - Frontend developers:
 * - Send ONLY the day objects, not images as separate items
 * - Images must be inside the day object's 'images' array
 * - Image URLs should be Cloudinary URLs, NOT base64 strings
 * - Base64 strings will be rejected
 * 
 * ✅ Correct structure:
 * {
 *   "days": [
 *     {
 *       "_id": "507f1f77bcf86cd799439011",
 *       "title": "Day 1",
 *       "description": "Arrival day",
 *       "location": "Kathmandu",
 *       "images": [
 *         { "imageUrl": "https://res.cloudinary.com/..." }
 *       ]
 *     }
 *   ]
 * }
 * 
 * ❌ Wrong structure (mixing days with base64):
 * {
 *   "days": [
 *     { "_id": "...", "title": "Day 1" },
 *     "data:image/png;base64,iVBORw0KG..."  ← This will be rejected
 *   ]
 * }
 */
export const reorderDays = async (req, res) => {
  try {
    const { days } = req.body;
    
    // Validation step 1: Check if days exists and is an array
    if (!days || !Array.isArray(days)) {
      return res.status(400).json({ 
        error: "Request must include 'days' as an array",
        received: typeof days
      });
    }

    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    // Validation step 2: Filter and validate each day object
    const validDays = [];
    const rejectedItems = [];

    for (let i = 0; i < days.length; i++) {
      const item = days[i];
      
      // Reject base64 strings or non-objects
      if (typeof item === 'string') {
        if (item.startsWith('data:image/') || item.length > 100) {
          rejectedItems.push({ index: i, reason: 'Base64 image string detected', type: 'string' });
          continue;
        }
        rejectedItems.push({ index: i, reason: 'String value not allowed', type: 'string' });
        continue;
      }
      
      // Must be an object
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        rejectedItems.push({ index: i, reason: 'Must be an object', type: typeof item });
        continue;
      }

      // Must have description (required field)
      if (!item.description || typeof item.description !== 'string') {
        rejectedItems.push({ index: i, reason: 'Missing required field: description' });
        continue;
      }

      // Valid day object - clean and add
      validDays.push({
        _id: item._id,
        title: item.title || '',
        description: item.description,
        location: item.location || '',
        images: Array.isArray(item.images) ? item.images : []
      });
    }

    // Check if we have any valid days
    if (validDays.length === 0) {
      return res.status(400).json({ 
        error: "No valid day objects found in request",
        rejected: rejectedItems,
        hint: "Send an array of day objects with structure: { _id, title, description, location, images }"
      });
    }

    // Log rejected items if any
    if (rejectedItems.length > 0) {
      console.warn(`Reorder Days: ${rejectedItems.length} invalid items rejected:`, rejectedItems);
    }

    // Reassign day numbers sequentially
    const reorderedDays = validDays.map((day, idx) => ({
      ...day,
      dayNumber: idx + 1
    }));

    // Update itinerary with cleaned and reordered days
    itinerary.itinerary_days = reorderedDays;
    await itinerary.save();

    res.json({
      success: true,
      itinerary,
      processed: {
        total: days.length,
        valid: validDays.length,
        rejected: rejectedItems.length
      }
    });

  } catch (err) {
    console.error("Reorder days error:", err);
    res.status(500).json({ 
      error: "Failed to reorder days",
      details: err.message 
    });
  }
};
