import express from "express";
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  generateTemplate,
} from "../controller/EmailTemplate.js";

const router = express.Router();

// CRUD routes
router.post("/", createTemplate);
router.get("/", getTemplates);
router.get("/:id", getTemplateById);
router.put("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);

// LLM generation route
router.post("/generate", generateTemplate);

export default router;
