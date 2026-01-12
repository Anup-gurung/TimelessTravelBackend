import express from "express";
import { signupAdmin, loginUser, getAllAdmins } from "../controllers/auth.controller.js";

const router = express.Router();
router.post("/signup", signupAdmin);
router.post("/login", loginUser);
router.get("/all", getAllAdmins);
export default router;