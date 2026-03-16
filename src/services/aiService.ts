import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const summarizeChat = async (messages: string[]) => {
  if (messages.length === 0) return "No messages to summarize.";
  
  const prompt = `Please summarize the following chat conversation concisely:\n\n${messages.join("\n")}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful assistant that summarizes chat conversations. Keep it brief and highlight key points.",
      }
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Summarization error:", error);
    return "Error generating summary.";
  }
};

export const translateText = async (text: string, targetLanguage: string) => {
  if (!text) return "";
  
  const prompt = `Translate the following text to ${targetLanguage}:\n\n${text}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are a professional translator. Translate the text accurately to ${targetLanguage}. Return only the translated text.`,
      }
    });
    return response.text || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
};
