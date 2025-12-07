import express from "express";
import authRoutes from "./Auth.js";
import uploadRoutes from "./UploadCsv.js";
import sendEmail from "./SendEmail.js";
import passport from "passport";
const router = express.Router();

router.use("/auth", authRoutes);
const checkAuth = passport.authenticate("jwt", { session: false });

router.use("/upload", checkAuth, uploadRoutes);
router.use("/send-email", checkAuth, sendEmail);

export default router;
