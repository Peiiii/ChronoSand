import { GoogleGenAI, Type } from "@google/genai";
import { Palette } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePalette = async (theme: string): Promise<Palette> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a beautiful, cohesive color palette of 5 hex colors based on the theme: "${theme}". Provide a creative name for the palette.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "A creative name for the color palette",
            },
            colors: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "An array of 5 valid hex color codes (e.g., #FF5500)",
            },
          },
          required: ["name", "colors"],
        },
      },
    });

    if (!response.text) {
        throw new Error("No response from Gemini");
    }

    const data = JSON.parse(response.text) as Palette;
    return data;
  } catch (error) {
    console.error("Gemini palette generation failed:", error);
    // Fallback
    return {
      name: "Gemini Offline",
      colors: ["#FFFFFF", "#CCCCCC", "#888888", "#444444", "#000000"],
    };
  }
};
