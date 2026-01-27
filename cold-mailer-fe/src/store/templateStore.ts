import { create } from "zustand";
import axios from "../configs/axiosConfig";

export interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  body: string;
  userId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateStore {
  templates: EmailTemplate[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;

  // Actions
  fetchTemplates: () => Promise<void>;
  saveTemplate: (template: {
    name: string;
    subject: string;
    body: string;
    isDefault?: boolean;
  }) => Promise<EmailTemplate | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
  generateTemplate: (params: {
    purpose: string;
    target?: string;
    tone?: string;
  }) => Promise<{ subject: string; body: string } | null>;
}

export const useTemplateStore = create<TemplateStore>()((set) => ({
  templates: [],
  isLoading: false,
  isGenerating: false,
  error: null,

  fetchTemplates: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.get("/templates");
      set({ templates: response.data.templates || [] });
    } catch (err) {
      console.error("Error fetching templates:", err);
      set({ error: "Failed to fetch templates" });
    } finally {
      set({ isLoading: false });
    }
  },

  saveTemplate: async (template) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.post("/templates", template);
      const newTemplate = response.data.template;

      set((state) => ({
        templates: [newTemplate, ...state.templates],
      }));

      return newTemplate;
    } catch (err) {
      console.error("Error saving template:", err);
      set({ error: "Failed to save template" });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTemplate: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await axios.delete(`/templates/${id}`);

      set((state) => ({
        templates: state.templates.filter((t) => t._id !== id),
      }));

      return true;
    } catch (err) {
      console.error("Error deleting template:", err);
      set({ error: "Failed to delete template" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  generateTemplate: async (params) => {
    try {
      set({ isGenerating: true, error: null });
      const response = await axios.post("/templates/generate", params);
      return response.data.template;
    } catch (err: unknown) {
      console.error("Error generating template:", err);
      const axiosError = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Failed to generate template";
      set({ error: errorMessage });
      return null;
    } finally {
      set({ isGenerating: false });
    }
  },
}));

// Selectors
export const selectTemplates = (state: TemplateStore) => state.templates;
export const selectIsLoading = (state: TemplateStore) => state.isLoading;
export const selectIsGenerating = (state: TemplateStore) => state.isGenerating;
export const selectError = (state: TemplateStore) => state.error;
