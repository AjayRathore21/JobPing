import express from "express";
import { csvUpload, getUserCsvs, deleteCsv } from "../controller/Uploads.js";
import multer from "multer";
const router = express.Router();
const upload = multer({ dest: "/tmp/" }); // temporary folder for Lambda

router.get("/csv", getUserCsvs);
router.post("/csv", upload.single("csv"), csvUpload);
router.delete("/csv/:id", deleteCsv);

export default router;
