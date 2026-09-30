import { GoogleGenAI } from "@google/genai";
import { config } from "../config";

let _aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!config.geminiApiKey) return null;
  if (!_aiClient) {
    _aiClient = new GoogleGenAI({
      apiKey: config.geminiApiKey,
    });
  }
  return _aiClient;
}
