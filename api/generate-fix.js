/* =====================================================
   INVINCIBLE 360 - 2-MINUTE FIX API

   Purpose:
   Generate a short misconception-repair lesson
   followed by a verification question.

   Flow:

   Mistake
      ↓
   Generate Fix
      ↓
   Explanation
      ↓
   Example
      ↓
   Verification Question
      ↓
   Mastery Recovery
===================================================== */

export const maxDuration = 30;


/* =====================================================
   JSON EXTRACTION
===================================================== */

function extractJSON(text) {

    if (!text) {
        throw new Error('AI returned an empty response.');
    }


    let cleaned =
        String(text)
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();


    /*
       First attempt:
       response is already pure JSON.
    */

    try {

        return JSON.parse(cleaned);

    } catch (error) {
        // Continue to recovery parsing.
    }


    /*
       Second attempt:
       find the outermost JSON object.
    */

    const firstBrace =
        cleaned.indexOf('{');

    const lastBrace =
        cleaned.lastIndexOf('}');


    if (
        firstBrace !== -1 &&
        lastBrace > firstBrace
    ) {

        const possibleJSON =
            cleaned.slice(
                firstBrace,
                lastBrace + 1
            );


        try {

            return JSON.parse(
                possibleJSON
            );

        } catch (error) {}

    }


    throw new Error(
        'AI returned invalid JSON.'
    );

}


/* =====================================================
   VALIDATE FIX STRUCTURE
===================================================== */

function validateFix(data) {

    if (
        !data ||
        typeof data !== 'object'
    ) {

        throw new Error(
            'Invalid fix response.'
        );

    }


    const requiredTextFields = [
        'explanation',
        'example',
        'question'
    ];


    for (
        const field of requiredTextFields
    ) {

        if (
            typeof data[field] !== 'string' ||
            !data[field].trim()
        ) {

            throw new Error(
                `Missing fix field: ${field}`
            );

        }

    }


    if (
        !Array.isArray(data.options) ||
        data.options.length !== 4
    ) {

        throw new Error(
            'Fix must contain exactly 4 options.'
        );

    }


    data.options =
        data.options.map(
            option => String(option)
        );


    const correctIndex =
        Number(data.correctIndex);


    if (
        !Number.isInteger(correctIndex) ||
        correctIndex < 0 ||
        correctIndex > 3
    ) {

        throw new Error(
            'Invalid correctIndex.'
        );

    }


    data.correctIndex =
        correctIndex;


    return data;

}


/* =====================================================
   BUILD PROMPT
===================================================== */

function buildPrompt({
    subject,
    topic,
    coreMisconception,
    originalQuestion
}) {

    return `

You are the 2-Minute Fix teacher inside Invincible 360.

Your job is to repair ONE specific student misconception.

This is NOT a normal lesson.
This is NOT a long explanation.
This is a targeted recovery intervention.

=====================================================
STUDENT CONTEXT
=====================================================

Subject:
${subject || 'General'}

Topic:
${topic || 'General Concept'}

Original Question:
${originalQuestion || 'Not available'}

Core Misconception:
${coreMisconception || 'The student has misunderstood an important concept.'}


=====================================================
YOUR TASK
=====================================================

Create a short micro-lesson that:

1. Corrects the exact misconception.
2. Uses accurate board-level terminology.
3. Gives one useful example.
4. Tests whether the student actually understood the correction.


=====================================================
TEACHING RULES
=====================================================

- Prefer NCERT / CBSE-compatible concepts.
- Do not introduce unnecessary advanced theory.
- Do not give a long lecture.
- Explain WHY the misconception is wrong.
- Use natural language.
- Keep the explanation short.
- Make the verification question conceptually similar but NOT identical to the original question.
- The verification question must test the repaired idea, not random knowledge.
- Only ONE option may be correct.
- All four options must be plausible.
- Do not make the correct answer obviously longer or more detailed.
- Do not reveal the correct answer inside the explanation of the question.
- For Mathematics and Physics, preserve correct equations, signs and units.
- For Chemistry, preserve correct reaction terminology and conditions.
- For Biology, use accurate NCERT terminology and distinguish structure, function, process and cause-effect correctly.


=====================================================
OUTPUT
=====================================================

Return ONLY a JSON object.

No markdown.
No code fences.
No introductory text.

Use EXACTLY this structure:

{
  "explanation": "2-4 short sentences explaining and correcting the misconception.",
  "example": "One short example directly connected to the misconception.",
  "question": "One new multiple-choice verification question.",
  "options": [
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4"
  ],
  "correctIndex": 0
}

correctIndex MUST be zero-based.

0 = Option 1
1 = Option 2
2 = Option 3
3 = Option 4

=====================================================
IMPORTANT
=====================================================

The student should finish this intervention in about two minutes.

Think:

MISCONCEPTION → REPAIR → EXAMPLE → VERIFY

Do not turn it into a chapter.

`;

}


/* =====================================================
   GEMINI REQUEST
===================================================== */

async function callGemini(
    apiKey,
    model,
    prompt
) {

    const response =
        await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({

                    contents: [

                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }

                    ],

                    generationConfig: {

                        temperature: 0.2,

                        response_mime_type:
                            'application/json'

                    }

                })

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        const message =
            data?.error?.message ||
            `HTTP ${response.status}`;


        throw new Error(
            `Gemini ${model}: ${message}`
        );

    }


    const text =
        data
            ?.candidates?.[0]
            ?.content?.parts?.[0]
            ?.text;


    if (!text) {

        throw new Error(
            `Gemini ${model} returned no content.`
        );

    }


    return validateFix(
        extractJSON(text)
    );

}


/* =====================================================
   CLAUDE FALLBACK
===================================================== */

async function callClaude(
    apiKey,
    prompt
) {

    const response =
        await fetch(
            'https://api.anthropic.com/v1/messages',
            {
                method: 'POST',

                headers: {

                    'Content-Type':
                        'application/json',

                    'x-api-key':
                        apiKey,

                    'anthropic-version':
                        '2023-06-01',

                    'anthropic-dangerous-direct-browser-access':
                        'false'

                },

                body: JSON.stringify({

                    model:
                        'claude-3-5-haiku-latest',

                    max_tokens:
                        1800,

                    temperature:
                        0.2,

                    system:
                        'Return only the requested JSON object. No markdown.',

                    messages: [

                        {
                            role: 'user',
                            content: prompt
                        }

                    ]

                })

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        const message =
            data?.error?.message ||
            `HTTP ${response.status}`;


        throw new Error(
            `Claude: ${message}`
        );

    }


    const text =
        data
            ?.content
            ?.find(
                part =>
                    part.type === 'text'
            )
            ?.text;


    if (!text) {

        throw new Error(
            'Claude returned no content.'
        );

    }


    return validateFix(
        extractJSON(text)
    );

}


/* =====================================================
   MAIN HANDLER
===================================================== */

export default async function handler(
    req,
    res
) {

    /*
       CORS
    */

    res.setHeader(
        'Access-Control-Allow-Origin',
        '*'
    );

    res.setHeader(
        'Access-Control-Allow-Methods',
        'POST, OPTIONS'
    );

    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type'
    );


    if (req.method === 'OPTIONS') {

        return res
            .status(200)
            .end();

    }


    if (req.method !== 'POST') {

        return res
            .status(405)
            .json({
                error:
                    'Method not allowed'
            });

    }


    try {

        const {
            subject,
            topic,
            coreMisconception,
            originalQuestion
        } = req.body || {};


        /*
           Basic validation.
        */

        if (
            !topic &&
            !coreMisconception &&
            !originalQuestion
        ) {

            return res
                .status(400)
                .json({

                    error:
                        'Insufficient mistake context for a 2-Minute Fix.'

                });

        }


        const prompt =
            buildPrompt({

                subject:
                    subject || 'General',

                topic:
                    topic || 'General Concept',

                coreMisconception:
                    coreMisconception ||
                    'The student needs help understanding the core concept.',

                originalQuestion:
                    originalQuestion ||
                    ''

            });


        /*
           =================================================
           GEMINI PROVIDER
           =================================================

           Use multiple current models instead of relying
           on one model.

           The first available model wins.
        */

        const rawKeys =
            process.env.GEMINI_API_KEYS ||
            process.env.GEMINI_API_KEY;


        const geminiModels = [

            'gemini-3.6-flash',

            'gemini-3.5-flash',

            'gemini-3.5-flash-lite',

            'gemini-2.5-flash',

            'gemini-2.5-flash-lite'

        ];


        const errors = [];


        if (rawKeys) {

            const keys =
                rawKeys
                    .split(',')
                    .map(key => key.trim())
                    .filter(Boolean);


            /*
               Try each configured key and model.

               This is useful when multiple Gemini API
               keys are configured for the project.
            */

            for (
                const apiKey of keys
            ) {

                for (
                    const model of geminiModels
                ) {

                    try {

                        const fix =
                            await callGemini(
                                apiKey,
                                model,
                                prompt
                            );


                        return res
                            .status(200)
                            .json(fix);

                    } catch (error) {

                        console.warn(
                            `[2-Min Fix] ${error.message}`
                        );


                        errors.push(
                            error.message
                        );

                    }

                }

            }

        }


        /*
           =================================================
           CLAUDE FALLBACK
           =================================================
        */

        const anthropicKey =
            process.env.ANTHROPIC_API_KEY;


        if (anthropicKey) {

            try {

                const fix =
                    await callClaude(
                        anthropicKey,
                        prompt
                    );


                return res
                    .status(200)
                    .json(fix);

            } catch (error) {

                console.warn(
                    `[2-Min Fix] ${error.message}`
                );


                errors.push(
                    error.message
                );

            }

        }


        /*
           =================================================
           ALL PROVIDERS FAILED
           =================================================
        */

        console.error(
            '[2-Min Fix] All AI providers failed:',
            errors
        );


        return res
            .status(503)
            .json({

                error:
                    '2-Minute Fix is temporarily unavailable.',

                providerErrors:
                    errors.slice(-5)

            });


    } catch (error) {

        console.error(
            '[2-Min Fix] Unexpected error:',
            error
        );


        return res
            .status(500)
            .json({

                error:
                    'Failed to generate AI fix.'

            });

    }

}