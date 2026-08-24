export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        // 1. Fetch Weekly Test Questions
        const qRes = await fetch(`${supabaseUrl}/rest/v1/weekly_tests?select=*`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const questions = await qRes.json();

        // 2. Fetch Today's Daily Puzzle
        const today = new Date().toISOString().split('T')[0];
        const pRes = await fetch(`${supabaseUrl}/rest/v1/daily_puzzle?puzzle_date=eq.${today}&select=*`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const puzzles = await pRes.json();

        // 3. Fetch Leaderboard Scores
        const lRes = await fetch(`${supabaseUrl}/rest/v1/test_attempts?select=*&order=percentage.desc,created_at.desc&limit=7`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const leaderboard = await lRes.json();

        // 4. Curated Zero-Token Reel Deck (Fallback & High-Yield Pool for 9, 10, 11, 12)
        const reelDeck = [
            // CLASS 10
            { id: 101, class_name: "10", type: "mcq", subject: "Physics", topic: "Light & Optics", q_en: "If magnification m = -1 for a spherical mirror, where is the object placed?", q_hi: "यदि किसी गोलीय दर्पण के लिए m = -1 है, तो वस्तु कहाँ स्थित है?", options: ["At Infinity", "At Focus (F)", "At Centre of Curvature (C)", "Between F and P"], answer: 2, trap: "Negative magnification signifies a real and inverted image of identical size, which only happens at C." },
            { id: 102, class_name: "10", type: "trap", subject: "Physics", topic: "Electricity", title: "🚨 Ohm's Law Trap", content: "V = IR is ONLY valid when physical conditions like **temperature remain constant**. If wire heats up, resistance increases!", rule: "Always state 'at constant temperature' in CBSE theory questions to get full 1 mark." },
            { id: 103, class_name: "10", type: "formula", subject: "Physics", topic: "Electricity", title: "🧠 Power & Resistance Vault", formula: "P = VI = I^2R = \\frac{V^2}{R}", tip: "In series circuits, use P = I²R. In parallel household circuits, use P = V²/R!" },
            { id: 104, class_name: "10", type: "mcq", subject: "Chemistry", topic: "Chemical Reactions", q_en: "When lead nitrate powder is heated in a boiling tube, brown fumes are emitted. The gas is:", q_hi: "लेड नाइट्रेट को गर्म करने पर भूरे रंग का धुआँ निकलता है। वह गैस कौन सी है?", options: ["NO", "NO₂ (Nitrogen Dioxide)", "N₂O", "O₂"], answer: 1, trap: "2Pb(NO₃)₂ → 2PbO + 4NO₂↑ + O₂. Brown fumes are strictly NO₂." },
            { id: 105, class_name: "10", type: "trap", subject: "Chemistry", topic: "Acids & Bases", title: "🚨 Acid Dilution Danger", content: "NEVER add water to concentrated acid! It causes violent exothermic splashing.", rule: "Always add **Acid to Water** drop by drop with continuous stirring." },
            { id: 106, class_name: "10", type: "mcq", subject: "Mathematics", topic: "Trigonometry", q_en: "If sin θ + sin² θ = 1, then the value of cos² θ + cos⁴ θ is:", q_hi: "यदि sin θ + sin² θ = 1 है, तो cos² θ + cos⁴ θ का मान क्या होगा?", options: ["0", "1", "2", "-1"], answer: 1, trap: "sin θ = 1 - sin² θ = cos² θ. Squaring both sides: sin² θ = cos⁴ θ. So cos² θ + cos⁴ θ = sin θ + sin² θ = 1." },

            // CLASS 9
            { id: 901, class_name: "9", type: "mcq", subject: "Physics", topic: "Gravitation", q_en: "The value of acceleration due to gravity (g) at the center of the Earth is:", q_hi: "पृथ्वी के केंद्र पर गुरुत्वीय त्वरण (g) का मान कितना होता है?", options: ["9.8 m/s²", "Zero (0)", "Infinite", "4.9 m/s²"], answer: 1, trap: "At earth's geometric center, mass attracts equally in all directions, making net gravitational acceleration 0." },
            { id: 902, class_name: "9", type: "trap", subject: "Physics", topic: "Work & Energy", title: "🚨 Centripetal Work Trap", content: "Work done by centripetal force is ALWAYS ZERO because force is perpendicular to displacement (θ = 90°, cos 90° = 0).", rule: "Planets orbiting the Sun or electrons orbiting a nucleus do ZERO net work." },
            { id: 903, class_name: "9", type: "formula", subject: "Physics", topic: "Equations of Motion", title: "🧠 Uniform Acceleration Equations", formula: "v = u + at, \\quad s = ut + \\frac{1}{2}at^2, \\quad v^2 = u^2 + 2as", tip: "Check if body starts from rest (u = 0) or comes to a stop (v = 0)." },
            { id: 904, class_name: "9", type: "mcq", subject: "Chemistry", topic: "Matter in Surroundings", q_en: "Latent heat of vaporization is absorbed during which process?", q_hi: "वाष्पीकरण की गुप्त ऊष्मा किस प्रक्रिया के दौरान अवशोषित होती है?", options: ["Solid to Liquid", "Liquid to Gas (without temp rise)", "Gas to Liquid", "Liquid to Solid"], answer: 1, trap: "Latent heat breaks intermolecular bonds at constant temperature without raising kinetic energy." },

            // CLASS 11
            { id: 1101, class_name: "11", type: "mcq", subject: "Physics", topic: "Kinematics", q_en: "For a projectile, the angle of projection for maximum horizontal range is:", q_hi: "प्रक्षेप्य के लिए अधिकतम क्षैतिज परास का प्रक्षेपण कोण क्या है?", options: ["30°", "45°", "60°", "90°"], answer: 1, trap: "Range R = (u² sin 2θ)/g. Maximum when sin 2θ = 1 ⇒ 2θ = 90° ⇒ θ = 45°." },
            { id: 1102, class_name: "11", type: "trap", subject: "Chemistry", topic: "Thermodynamics", title: "🚨 State vs Path Function", content: "Work (W) and Heat (q) are PATH functions. Internal energy (U), Enthalpy (H), and Entropy (S) are STATE functions.", rule: "Never write Δq or Δw. Write q and w directly." },
            { id: 1103, class_name: "11", type: "formula", subject: "Mathematics", topic: "Trigonometry", title: "🧠 Double Angle Vault", formula: "\\cos 2\\theta = \\cos^2\\theta - \\sin^2\\theta = 2\\cos^2\\theta - 1 = 1 - 2\\sin^2\\theta", tip: "Crucial for simplifying calculus integrals in Class 12!" },

            // CLASS 12
            { id: 1201, class_name: "12", type: "mcq", subject: "Physics", topic: "Electrostatics", q_en: "Electric flux through a closed Gaussian surface enclosing an electric dipole is:", q_hi: "किसी बंद गॉसियन सतह के भीतर विद्युत द्विध्रुव होने पर कुल विद्युत फ्लक्स क्या होगा?", options: ["q / ε₀", "2q / ε₀", "Zero (0)", "Infinite"], answer: 2, trap: "Net enclosed charge inside a dipole is (+q - q) = 0. By Gauss's Law, Φ = Q_enclosed / ε₀ = 0." },
            { id: 1202, class_name: "12", type: "trap", subject: "Physics", topic: "Ray Optics", title: "🚨 Lens Formula Sign Trap", content: "Focal length of a CONVEX lens is ALWAYS POSITIVE (+f). Focal length of a CONCAVE lens is ALWAYS NEGATIVE (-f).", rule: "In mirror formula use 1/v + 1/u = 1/f; in lens formula use 1/v - 1/u = 1/f." },
            { id: 1203, class_name: "12", type: "formula", subject: "Chemistry", topic: "Chemical Kinetics", title: "🧠 First Order Rate Law", formula: "k = \\frac{2.303}{t} \\log_{10} \\left( \\frac{[A]_0}{[A]} \\right), \\quad t_{1/2} = \\frac{0.693}{k}", tip: "Half-life of a 1st order reaction is completely independent of initial reactant concentration!" }
        ];

        res.status(200).json({
            questions: Array.isArray(questions) ? questions : [],
            dailyPuzzle: Array.isArray(puzzles) && puzzles.length > 0 ? puzzles[0] : null,
            leaderboard: Array.isArray(leaderboard) ? leaderboard : [],
            reelDeck: reelDeck
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch platform data' });
    }
}
