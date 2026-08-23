// api/tts.js
import textToSpeech from '@google-cloud/text-to-speech';

export const maxDuration = 30;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST requests allowed." });

  try {
    const { text, languageCode = "hi-IN", voiceName = "hi-IN-Neural2-A", speakingRate = 1.0 } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required to generate speech." });
    }

    // Strip raw HTML tags, LaTeX delimiters, and Markdown formatting for clean reading
    const cleanText = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\$\$[\s\S]*?\$\$/g, " formula ")
      .replace(/\$([^\$]+)\$/g, "$1")
      .replace(/[*_#`~]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4500); // GCP TTS safe character limit per chunk

    // Authenticate using the GCP_SERVICE_ACCOUNT env var added to Vercel
    let credentials;
    if (process.env.GCP_SERVICE_ACCOUNT) {
      credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT);
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
        speakingRate: Number(speakingRate) || 1.0
      }
    };

    const [response] = await client.synthesizeSpeech(request);

    // Return the base64-encoded audio directly
    const audioContent = response.audioContent.toString("base64");

    return res.status(200).json({
      success: true,
      audioBase64: `data:audio/mp3;base64,${audioContent}`
    });
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate speech." });
  }
}
