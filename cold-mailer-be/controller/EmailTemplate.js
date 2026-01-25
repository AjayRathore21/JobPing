import EmailTemplate from "../model/EmailTemplate.js";
import { createLogger } from "../utils/logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const logger = createLogger("EmailTemplateController");

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create a new email template
 */
export const createTemplate = async (req, res) => {
  try {
    const { name, subject, body, isDefault } = req.body;
    const userId = req.user._id;

    if (!name || !subject || !body) {
      return res
        .status(400)
        .json({ error: "Name, subject, and body are required" });
    }

    // If this template is set as default, unset other defaults for this user
    if (isDefault) {
      await EmailTemplate.updateMany(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    const template = new EmailTemplate({
      name,
      subject,
      body,
      userId,
      isDefault: isDefault || false,
    });

    await template.save();

    logger.info("Template created", { templateId: template._id, userId });
    res
      .status(201)
      .json({ message: "Template created successfully", template });
  } catch (error) {
    logger.error("Error creating template", { error: error.message });
    res.status(500).json({ error: "Failed to create template" });
  }
};

/**
 * Get all templates for the current user
 */
export const getTemplates = async (req, res) => {
  try {
    const userId = req.user._id;
    const templates = await EmailTemplate.find({ userId }).sort({
      createdAt: -1,
    });

    res.json({ templates });
  } catch (error) {
    logger.error("Error fetching templates", { error: error.message });
    res.status(500).json({ error: "Failed to fetch templates" });
  }
};

/**
 * Get a single template by ID
 */
export const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const template = await EmailTemplate.findOne({ _id: id, userId });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({ template });
  } catch (error) {
    logger.error("Error fetching template", { error: error.message });
    res.status(500).json({ error: "Failed to fetch template" });
  }
};

/**
 * Update a template
 */
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { name, subject, body, isDefault } = req.body;

    const template = await EmailTemplate.findOne({ _id: id, userId });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // If setting as default, unset other defaults
    if (isDefault && !template.isDefault) {
      await EmailTemplate.updateMany(
        { userId, isDefault: true, _id: { $ne: id } },
        { isDefault: false },
      );
    }

    template.name = name ?? template.name;
    template.subject = subject ?? template.subject;
    template.body = body ?? template.body;
    template.isDefault = isDefault ?? template.isDefault;

    await template.save();

    logger.info("Template updated", { templateId: id, userId });
    res.json({ message: "Template updated successfully", template });
  } catch (error) {
    logger.error("Error updating template", { error: error.message });
    res.status(500).json({ error: "Failed to update template" });
  }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const template = await EmailTemplate.findOneAndDelete({ _id: id, userId });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    logger.info("Template deleted", { templateId: id, userId });
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    logger.error("Error deleting template", { error: error.message });
    res.status(500).json({ error: "Failed to delete template" });
  }
};

/**
 * Generate a template using LLM (Google Gemini SDK)
 */
export const generateTemplate = async (req, res) => {
  try {
    const { purpose, target, tone } = req.body;

    if (!purpose) {
      return res.status(400).json({ error: "Purpose is required" });
    }

    // Read the prompt template
    const promptPath = path.join(__dirname, "../prompts/generateTemplate.txt");
    let promptTemplate = fs.readFileSync(promptPath, "utf-8");

    // Replace placeholders in the prompt
    promptTemplate = promptTemplate
      .replace("{{purpose}}", purpose || "job application")
      .replace("{{target}}", target || "recruiters and hiring managers")
      .replace("{{tone}}", tone || "professional yet friendly");

    // Initialize Gemini SDK
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(promptTemplate);
    const response = await result.response;
    const generatedText = response.text();

    if (!generatedText) {
      return res.status(500).json({ error: "No content generated" });
    }

    // Parse the JSON response from the LLM
    let parsedResponse;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      logger.error("Failed to parse LLM response", {
        error: parseError.message,
        response: generatedText,
      });
      // Return raw text if parsing fails
      parsedResponse = {
        subject: "Generated Email Subject",
        body: generatedText,
      };
    }

    logger.info("Template generated via LLM", { userId: req.user._id });
    res.json({
      message: "Template generated successfully",
      template: parsedResponse,
    });
  } catch (error) {
    logger.error("Error generating template", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Failed to generate template",
      message: error.message,
    });
  }
};
