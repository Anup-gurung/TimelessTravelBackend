import jwt from "jsonwebtoken";

export const verifyAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided. Access denied." 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token has expired. Please log in again.",
        expired: true
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: "Invalid token" 
    });
  }
};
