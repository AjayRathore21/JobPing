import express from "express";
import { csvUpload } from "../controller/Uploads.js";
import multer from "multer";
const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temporary folder

router.post("/csv", upload.single("csv"), csvUpload);

export default router;
