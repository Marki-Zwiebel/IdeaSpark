
import { GoogleGenAI, Type } from "@google/genai";
import { AppIdea, VoiceAnalysisResponse, IdeaStatus } from "../types";

// Funkcia na získanie AI klienta, ktorá kontroluje existenciu kľúča
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API_KEY missing in environment variables.");
    // Vrátime dummy objekt alebo vyhodíme chybu až pri volaní, nie pri štarte
    return new GoogleGenAI({ apiKey: "MISSING" });
  }
  return new GoogleGenAI({ apiKey });
};

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
    - Font Style: Professional, systematic, technical.
    - Structure:
      1. ## SYSTEM ARCHITECTURE (Heading 2)
      2. Bulleted list of components.
      3. --- (Horizontal rule separator)
      4. ## CORE FUNCTIONALITY
      5. Numbered or bulleted list of features.
      6. ---
      7. ## DATABASE SCHEMA
      8. Markdown table or code block.
      9. ## ROADMAP
      10. Step-by-step list.
    - Language: English.
    - Length: Detailed, approx 450-600 words.
    
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
    
    USER VOICE COMMAND (Slovak or English):
    "${instruction}"
    
    TASK:
    Analyze the user instruction and return the COMPLETE updated JSON object for this idea.
    - Map Slovak requests (e.g., "zmeň prioritu na 5", "zmeň názov na...", "uprav blueprint") to the correct fields.
    - If updating the blueprint (devPrompt), use STRICT MARKDOWN (## headings, --- separators, lists).
    - NEVER change or lose the "id", "userId", "createdAt", or "imageUrl" unless specifically asked to change the image URL (unlikely).
    
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
    console.error("Voice update parsing failed", e);
    throw new Error("Failed to parse AI response. Ensure your command is clear.");
  }
}

/**
 * Vygeneruje vizuál pre nápad.
 */
export async function generateIdeaImage(title: string, description: string): Promise<string | undefined> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A professional, ultra-high-definition digital product showcase image for an app called "${title}". Theme: ${description}. Modern UI, vibrant glassmorphism, 3D elements, clean and cinematic.` }]
      },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  } catch (e) { console.error("Image gen failed", e); }
  return undefined;
}
