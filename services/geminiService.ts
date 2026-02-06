import { GoogleGenAI, Type } from "@google/genai";
import { AppIdea, VoiceAnalysisResponse, IdeaStatus } from "../types";

/**
 * Pomocná funkcia na bezpečné získanie GoogleGenAI inštancie.
 */
function getAI() {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === '') {
    throw new Error("Gemini API kľúč nie je nastavený. Prosím, pridajte ho do Environment Variables vo Verceli.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Analyzuje hlasový vstup a vráti kompletnú štruktúru nápadu vrátane metadát a rozsiahleho blueprintu v Markdown.
 */
export async function analyzeVoiceInput(text: string): Promise<VoiceAnalysisResponse> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this app idea voice transcript: "${text}".
    
    TASK:
    Generate a complete, high-level professional application profile.
    
    METADATA RULES:
    - category: Must be one of: "Work", "Leisure", "Side Project", "Other".
    - importance: 1 (lowest) to 5 (highest).
    - platform: Must be "Desktop", "Mobile", "Tablet", or "TV".
    
    STRICT BLUEPRINT RULES (devPrompt field):
    - Format: MARKDOWN only.
    - Structure:
      1. ## SYSTEM ARCHITECTURE
      2. Bulleted list of components.
      3. ---
      4. ## CORE FUNCTIONALITY
      5. Bulleted list of features.
      6. ---
      7. ## DATABASE SCHEMA
      8. ## ROADMAP
    - Language: English.
    
    Return ONLY JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          importance: { type: Type.NUMBER },
          targetAudience: { type: Type.STRING },
          platform: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          devPrompt: { type: Type.STRING }
        },
        required: ["title", "description", "category", "importance", "targetAudience", "platform", "tags", "devPrompt"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as VoiceAnalysisResponse;
}

/**
 * Inteligentne upraví existujúci nápad na základe hlasového pokynu.
 */
export async function proposeUpdateViaVoice(idea: AppIdea, instruction: string): Promise<AppIdea> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are an AI SYSTEM ARCHITECT for IdeaSpark. 
    
    CURRENT OBJECT DATA:
    ${JSON.stringify(idea)}
    
    USER VOICE COMMAND:
    "${instruction}"
    
    TASK:
    Analyze the user instruction and return the COMPLETE updated JSON object for this idea.
    - Map Slovak requests to the correct fields.
    - If updating the blueprint (devPrompt), use STRICT MARKDOWN.
    
    Return ONLY valid JSON matching the AppIdea structure.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          userId: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          status: { type: Type.STRING },
          category: { type: Type.STRING },
          importance: { type: Type.NUMBER },
          targetAudience: { type: Type.STRING },
          platform: { type: Type.STRING },
          appUrl: { type: Type.STRING },
          devPrompt: { type: Type.STRING },
          createdAt: { type: Type.NUMBER },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          imageUrl: { type: Type.STRING }
        },
        required: ["id", "userId", "title", "description", "status", "category", "importance", "targetAudience", "platform", "devPrompt", "createdAt", "tags"]
      }
    }
  });
  
  try {
    const text = response.text || '{}';
    const updated = JSON.parse(text);
    return { 
      ...updated,
      id: idea.id,
      userId: idea.userId,
      createdAt: idea.createdAt,
      imageUrl: updated.imageUrl || idea.imageUrl
    };
  } catch (e) {
    throw new Error("Nepodarilo sa spracovať AI odpoveď.");
  }
}

/**
 * Vygeneruje vizuál pre nápad.
 */
export async function generateIdeaImage(title: string, description: string): Promise<string | undefined> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A professional digital product showcase image for an app called "${title}". Theme: ${description}. Modern UI.` }]
      },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  } catch (e) { console.error("Generovanie obrázka zlyhalo:", e); }
  return undefined;
}