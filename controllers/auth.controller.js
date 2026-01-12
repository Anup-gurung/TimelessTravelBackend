import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signupAdmin = async (req, res) => {
  try {
    // 1. Pull values from req.body
    const { email, username, password } = req.body; 

    // 2. DEBUG: Add this line to see if email is actually arriving from Postman
    console.log("Data received from Postman:", { email, username });

    if (!email || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create admin - ENSURE email is included here!
    const admin = await Admin.create({
      email: email.toLowerCase().trim(), // Explicitly mapping
      username: username.trim(),
      password: hashedPassword
    });

    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Signup failed" });
  }
};

export const loginUser = async (req, res) => {
  try {
    // 1. Normalize input
    const email = req.body.email?.toLowerCase().trim();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    console.log(`🔍 Attempting login for: ${email}`);

    // 2. Find admin
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      console.log("❌ Login failed: Email not found in database");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Verify password
    // We compare the PLAIN TEXT password from req.body with the HASH from the database
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      console.log("❌ Login failed: Password mismatch");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Generate token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    console.log("✅ Login successful");
    res.status(200).json({
      message: "Login successful",
      token,
      admin: { id: admin._id, username: admin.username, email: admin.email }
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// ... keep your getAllAdmins and deleteAllAdmins as they were
export const getAllAdmins = async (req, res) => {
  try {
    // We use .find({}) to get every record in the Admin collection
    const admins = await Admin.find({});

    console.log(`📊 Fetching all admins. Count: ${admins.length}`);

    res.status(200).json({
      count: admins.length,
      admins: admins.map(admin => ({
        id: admin._id,
        username: admin.username,
        email: admin.email, // Check if this comes back as undefined!
        passwordHash: admin.password, // Useful for debugging
        createdAt: admin.createdAt
      }))
    });
  } catch (error) {
    console.error("❌ GetAdmins error:", error);
    res.status(500).json({ message: "Failed to fetch admins", error: error.message });
  }
};