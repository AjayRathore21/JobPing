import express from "express";
import { sendCustomMail } from "../controller/CustomMail.js";

const router = express.Router();

router.post("/", sendCustomMail);

export default router;
