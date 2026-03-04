import express from "express";
import { signupAdmin, loginUser, getAllAdmins } from "../controllers/auth.controller.js";


//routing 
const router = express.Router();
// post routing to signup
router.post("/signup", signupAdmin);
router.post("/login", loginUser);
router.get("/all", getAllAdmins);
export default router;
