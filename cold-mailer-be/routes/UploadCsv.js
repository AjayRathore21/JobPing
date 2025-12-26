import express from "express";
import { csvUpload, getUserCsvs } from "../controller/Uploads.js";
import multer from "multer";
const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temporary folder

router.get("/csv", getUserCsvs);
router.post("/csv", upload.single("csv"), csvUpload);

export default router;
