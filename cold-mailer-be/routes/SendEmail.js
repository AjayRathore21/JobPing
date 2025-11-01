import express from "express";
import sendEmail from "../controller/SendEmail.js";
const router = express.Router();

router.get("/", sendEmail);

export default router;
