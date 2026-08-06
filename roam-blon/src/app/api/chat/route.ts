import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize the SDK with the API Key from your .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt, history } = await req.json();

    // 1. Check if Gemini API Key exists
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_api_key_here") {
      console.error("ERROR: GEMINI_API_KEY is not defined in .env.local");
      return NextResponse.json({ text: "Server configuration error (Gemini Key missing)." }, { status: 500 });
    }

    // 2. Setup the Model (Gemini 1.5 Flash)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `You are the "Roam-Blon Travel Guru", a friendly, high-energy local expert from Romblon, Philippines. 
      Your goal is to help tourists have the best possible experience in our islands (Romblon, Tablas, and Sibuyan).
      - Be extremely knowledgeable about: Bonbon Beach, island hopping to Tres Islas, accredited tour guides, and local delicacies like Sarsa.
      - Use a warm, welcoming tone. Frequent use of island emojis (🏝️, 🌊, 🥥) and local greetings like "Mabuhay!"
      - Always prioritize safety and environmental respect (remind them not to leave trash on beaches).
      - If users ask about bookings, remind them they can manage tour guide bookings directly through the Roam-Blon portal.
      - Keep responses punchy and easy to read on mobile. 
      - IMPORTANT: DO NOT use markdown formatting. DO NOT use asterisks (*) or double asterisks (**) for bolding or lists. Use only plain text and emojis.`
    });

    // 3. Convert and strictly format history for Gemini
    const geminiHistory: any[] = [];
    (history || []).forEach((msg: any) => {
      const text = msg.parts?.[0]?.text || msg.content || " ";
      const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
      
      // Gemini STRICT RULE 1: History must start with 'user'
      if (geminiHistory.length === 0) {
        if (role === "user") {
          geminiHistory.push({ role, parts: [{ text }] });
        }
      } else {
        // Gemini STRICT RULE 2: Roles must strictly alternate (user -> model -> user)
        const lastRole = geminiHistory[geminiHistory.length - 1].role;
        if (lastRole !== role) {
          geminiHistory.push({ role, parts: [{ text }] });
        } else {
          // If subsequent messages are same role, combine them to fix formatting
          geminiHistory[geminiHistory.length - 1].parts[0].text += `\n${text}`;
        }
      }
    });

    // 4. Start Chat Session with History
    const chatSession = model.startChat({
      history: geminiHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    // 5. Send Message and Get Response
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("GEMINI_API_FAILURE:", error.message);

    let diagnosticMsg = "The island signal is a bit weak! Please try sending that again. 🌊";
    
    // Check for common Gemini error messages
    if (error?.message?.includes("API_KEY_INVALID")) {
      diagnosticMsg = "Gemini API Key is invalid or expired. Please check your .env.local file. 🔑";
    } else if (error?.message?.includes("SAFETY")) {
      diagnosticMsg = "The Travel Guru blocked this message due to safety filters. 🛡️";
    } else if (error?.message?.includes("quota")) {
      diagnosticMsg = "Gemini API quota reached. Please check your Google AI Studio dashboard. 📈";
    } else if (error?.message?.includes("503") || error?.message?.includes("high demand")) {
      diagnosticMsg = "Our AI Travel Guru is currently assisting many tourists and the connection is busy. Please try asking again in a few moments! 🏝️";
    }

    return NextResponse.json(
      { text: diagnosticMsg }, 
      { status: 500 }
    );
  }
}