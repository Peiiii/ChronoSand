
import { GoogleGenAI, Type } from "@google/genai";
import { Palette, WorldBlueprint } from "../types";

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

export const generateWorldBlueprint = async (prompt: string): Promise<WorldBlueprint> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You are a Physics Sandbox Architect.
        The canvas is 300px wide by 300px high. (0,0) is top-left.
        Create a scene description based on the user's prompt: "${prompt}".
        
        Available Materials (element):
        - STONE: Static walls, ground, mountains.
        - SAND: Falling dust.
        - WATER: Liquid, settles at bottom.
        - FIRE: Rising gas, disappears at top.
        - ERASER: Empty space.

        Instructions:
        1. Break the scene down into geometric primitives (RECTANGLE, CIRCLE).
        2. Use STONE for ground/containers.
        3. Use WATER for lakes/seas.
        4. Use FIRE for volcanoes/suns.
        5. Use SAND for dunes/terrain.
        6. Ensure coordinates are within 0-300 range.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Title of the scene" },
            description: { type: Type.STRING, description: "Short description of what was generated" },
            shapes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["RECTANGLE", "CIRCLE"] },
                  element: { type: Type.STRING, enum: ["STONE", "SAND", "WATER", "FIRE", "ERASER"] },
                  color: { type: Type.STRING, description: "Hex color code" },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  w: { type: Type.NUMBER },
                  h: { type: Type.NUMBER },
                  cx: { type: Type.NUMBER },
                  cy: { type: Type.NUMBER },
                  r: { type: Type.NUMBER },
                },
                required: ["type", "element", "color"],
              },
            },
          },
          required: ["name", "shapes"],
        },
      },
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text) as WorldBlueprint;
  } catch (error) {
    console.error("Genesis generation failed:", error);
    return {
      name: "Void",
      description: "Generation failed.",
      shapes: []
    };
  }
};
