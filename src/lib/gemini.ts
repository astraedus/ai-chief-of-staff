import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let _flash: GenerativeModel | null = null;
let _flashText: GenerativeModel | null = null;

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenerativeAI(apiKey);
}

export function getGeminiFlash(): GenerativeModel {
  if (!_flash) {
    _flash = getClient().getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
  }
  return _flash;
}

export function getGeminiFlashText(): GenerativeModel {
  if (!_flashText) {
    _flashText = getClient().getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.3,
      },
    });
  }
  return _flashText;
}
