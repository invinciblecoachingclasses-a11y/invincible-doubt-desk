import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

const systemInstruction = `You are a high-school educator and national board exam topper. Generate structured revision notes ("Topper Notes") for Classes 9 to 12 following the NCERT/CBSE curriculum.
- Format all equations, formulas, and units in standard LaTeX using $inline$ and $$display$$ notation.
- Structure the content with clean Markdown: bullet points, bold key terms, tables, and callout sections.
- Keep the tone concise, high-yield, and focused on board exam scoring.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { classLevel, subject, chapter } = req.body;

  if (!classLevel || !subject || !chapter) {
    return res.status(400).json({ error: 'Missing classLevel, subject, or chapter' });
  }

  const cleanChapter = chapter.trim().toLowerCase();

  try {
    // 1. Check Supabase cache
    const { data: cachedNote } = await supabase
      .from('topper_notes')
      .select('content_markdown')
      .eq('class_level', classLevel)
      .eq('subject', subject)
      .ilike('chapter', cleanChapter)
      .maybeSingle();

    if (cachedNote && cachedNote.content_markdown) {
      return res.status(200).json({
        source: 'cache',
        notesMarkdown: cachedNote.content_markdown
      });
    }

    // 2. Generate with Gemini API
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction
    });

    const prompt = `Generate comprehensive "Topper Notes" for:
- Class: Class ${classLevel}
- Subject: ${subject}
- Chapter: ${chapter}

Follow this exact structure:
1. 📌 Chapter Overview (2-3 concise sentences)
2. 🧠 Core Concepts & Key Definitions (bullet points with bold terms)
3. 📐 Formulas, Reactions & Laws (use markdown tables or display LaTeX)
4. ⭐ Must-Remember Points & Mnemonics
5. ⚠️ Common Mistakes & Exam Pitfalls
6. 🎯 Board Exam Focus (Top 3 questions with brief model answers)
7. ⚡ 60-Second Revision Checklist`;

    const result = await model.generateContent(prompt);
    const markdown = result.response.text();

    // 3. Save to Supabase
    await supabase.from('topper_notes').insert([
      {
        class_level: classLevel,
        subject: subject,
        chapter: cleanChapter,
        content_markdown: markdown
      }
    ]);

    return res.status(200).json({
      source: 'gemini',
      notesMarkdown: markdown
    });

  } catch (error) {
    console.error('Notes generation error:', error);
    return res.status(500).json({
      error: 'An active internet connection is required to load and compile chapter notes. Please try again.'
    });
  }
}
