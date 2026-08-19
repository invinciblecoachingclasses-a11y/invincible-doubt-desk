import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Accept both className and classLevel
  const cls = req.body.className || req.body.classLevel;
  const sub = req.body.subject;
  const chapter = req.body.chapter;
  const customStructure = req.body.structure;

  if (!cls || !sub || !chapter) {
    return res.status(400).json({ error: 'Missing class, subject, or chapter' });
  }

  const cleanChapter = chapter.trim().toLowerCase();

  try {
    // 1. Check Supabase cache
    const { data: cachedNote } = await supabase
      .from('topper_notes')
      .select('content_markdown')
      .eq('class_level', String(cls))
      .eq('subject', sub)
      .ilike('chapter', cleanChapter)
      .maybeSingle();

    if (cachedNote && cachedNote.content_markdown) {
      return res.status(200).json({
        notes: cachedNote.content_markdown
      });
    }

    // 2. Generate with Gemini
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });

    const prompt = customStructure || `Act as an expert CBSE teacher and school topper. Generate complete revision notes for Class ${cls} ${sub}, Chapter: ${chapter}. Include key definitions, formulas in LaTeX format, exam traps, and quick revision points.`;

    const result = await model.generateContent(prompt);
    const generatedContent = result.response.text();

    // 3. Save to Supabase cache
    await supabase.from('topper_notes').insert([
      {
        class_level: String(cls),
        subject: sub,
        chapter: cleanChapter,
        content_markdown: generatedContent
      }
    ]);

    // Return under the exact 'notes' property index.html expects
    return res.status(200).json({
      notes: generatedContent
    });

  } catch (error) {
    console.error('API Generation error:', error);
    return res.status(500).json({ error: 'Failed to generate notes.' });
  }
}
