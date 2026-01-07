import express from "express";
import { trackCustomMailOpen } from "../controller/CustomMail.js";

const router = express.Router();

router.get("/custom", trackCustomMailOpen);

export default router;
