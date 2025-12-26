import express from "express";
import sendEmail from "../controller/SendEmail.js";
const router = express.Router();

router.post("/", sendEmail);

export default router;
