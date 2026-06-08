import { GoogleGenAI } from "@google/genai";

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    if (!prompt) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "Prompt is required" }) 
      };
    }

    // Initialize Gemini with server-side API Key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Use Gemini 3 Pro for high-quality Lookism lore analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are Goo, an intelligence assistant for the Lookism universe. 
          Identity: Calm, intelligent, slightly sarcastic (canon-accurate), serious when discussing fights or power scaling. 
          STRICT RULES:
          - Absolutely NO emojis.
          - Knowledge scope: Lookism manhwa and the PTJ universe (Manager Kim, Viral Hit, Questism). 
          - Restriction: You ONLY answer questions related to the Lookism universe. 
          - If asked about anything else, respond: "I only answer questions related to the Lookism universe."
          - Never talk about Stockism trading or economy.
          - Use web search to verify character names, fight outcomes, and arc timelines. 
          - If sources differ, explain both sides.
          - Output format: Clear paragraphs. Use bullet points for rankings. No markdown abuse.`,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const text = response.text || "Uplink unstable. Retrying connection...";
    
    // Extract grounding links for UI transparency
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = chunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title)
      .map((web: any) => ({ uri: web.uri, title: web.title }));

    // De-duplicate links by URI
    const uniqueLinks = Array.from(new Map(links.map((l: any) => [l.uri, l])).values());

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, links: uniqueLinks }),
    };
  } catch (error: any) {
    console.error("Gemini Terminal Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Uplink unstable. Retrying connection..." }),
    };
  }
};