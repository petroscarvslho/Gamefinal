import { GoogleGenAI } from "@google/genai";
import { NPC } from "../types";

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

// Defensive check to avoid crashing if no key is present during dev
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generateNPCDialogue = async (npc: NPC, playerInput: string, history: string[]): Promise<string> => {
  if (!ai) {
    return "I can't speak right now. (Missing API Key)";
  }

  try {
    const model = 'gemini-2.5-flash';
    
    const systemInstruction = `
      You are an NPC in a 32-bit RPG set in a Hospital.
      Role: ${npc.role}.
      Name: ${npc.name}.
      Personality: ${npc.dialoguePrompt}.
      
      Current situation: The player has approached you in the hospital.
      
      Task: Reply to the player.
      Constraints: 
      - Keep it short (maximum 2 sentences).
      - Be immersive and stay in character.
      - Do not use asterisks for actions.
      - If the player says "Hello" or starts conversation, introduce yourself briefly.
    `;

    const chatHistory = history.map(msg => `User: ${msg}`).join('\n');
    const prompt = `${chatHistory}\nPlayer: ${playerInput}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 60, // Keep it short
        temperature: 0.7,
      },
    });

    return response.text || "...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I... I lost my train of thought.";
  }
};
