import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { className, subject, chapter, structure } = req.body;

  if (!className || !subject || !chapter) {
    return res.status(400).json({ error: 'Missing class, subject, or chapter' });
  }

  try {
    const prompt = `You are a CBSE Board exam topper and expert teacher.
Generate structured, highly accurate revision notes for:
Class: ${className}
Subject: ${subject}
Chapter: ${chapter}

Instructions on format:
${structure}

Make sure every definition, formula, derivation hint, and exam tip is factually accurate for the official CBSE Class ${className} ${subject} syllabus.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const outputText = response.text || '';
    const cleanHTML = outputText.replace(/```html/gi, '').replace(/```/g, '').trim();

    return res.status(200).json({ notes: cleanHTML });
  } catch (error) {
    console.error('Notes Generation Error:', error);
    return res.status(500).json({ error: 'Failed to generate notes from AI service.' });
  }
}
