// api/tts.js
import textToSpeech from '@google-cloud/text-to-speech';

export const maxDuration = 30;

export default async function handler(req, res) {
  // ============================================================
  // CORS HEADERS
  // ============================================================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST requests allowed." });

  try {
    const { 
      text, 
      languageCode = "hi-IN", 
      voiceName = "hi-IN-Neural2-A", 
      speakingRate = 1.05 
    } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required to generate speech." });
    }

    // Strip raw HTML tags, LaTeX delimiters, Markdown formatting, and emojis for clean audio pronunciation
    const cleanText = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, " $1 divided by $2 ")
      .replace(/\\sqrt\{([^}]*)\}/g, " square root of $1 ")
      .replace(/\$\$[\s\S]*?\$\$/g, " formula ")
      .replace(/\$([^\$]+)\$/g, " $1 ")
      .replace(/[*_#`~>]/g, " ")
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, "") // Strip emoji characters
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4500); // Safe character ceiling per GCP TTS chunk

    // Authenticate using the GCP_SERVICE_ACCOUNT env var added to Vercel
    let credentials;
    if (process.env.GCP_SERVICE_ACCOUNT) {
      try {
        credentials = typeof process.env.GCP_SERVICE_ACCOUNT === "string" 
          ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT) 
          : process.env.GCP_SERVICE_ACCOUNT;
      } catch (parseErr) {
        console.warn("GCP_SERVICE_ACCOUNT JSON parse warning:", parseErr);
      }
    }

    const client = new textToSpeech.TextToSpeechClient({
      credentials: credentials || undefined
    });

    const request = {
      input: { text: cleanText },
      voice: {
        languageCode: languageCode,
        name: voiceName,
        ssmlGender: "FEMALE"
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: Math.min(Math.max(Number(speakingRate) || 1.05, 0.75), 1.5)
      }
    };

    const [response] = await client.synthesizeSpeech(request);

    if (!response || !response.audioContent) {
      throw new Error("Empty audio stream received from TTS service.");
    }

    const audioContent = response.audioContent.toString("base64");

    return res.status(200).json({
      success: true,
      audioBase64: `data:audio/mp3;base64,${audioContent}`
    });
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to synthesize speech." 
    });
  }
}
