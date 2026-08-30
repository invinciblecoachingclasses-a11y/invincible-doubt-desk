export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const fallbackPuzzle = {
    id: 999,
    question: "Is √(-4) × √(-9) equal to +6 or -6? / क्या √(-4) × √(-9) का मान +6 या -6 है?",
    options: ["+6", "-6", "±6", "Not Real"],
    correct_option: 1,
    explanation: "√(-4) × √(-9) = (2i) × (3i) = 6i² = -6 (since i² = -1).",
    xp_reward: 50
  };

  // Master Curated Interactive Decks Across Grades
  const defaultInteractiveReels = [
    // --- CLASS 9 INTERACTIVE DECK ---
    {
      id: 901,
      class_name: "9",
      type: "mcq",
      hook: "⚡ 5 SECOND CHALLENGE",
      title: "Inertia of Rest",
      subject: "Physics",
      topic: "Laws of Motion",
      q_en: "When a carpet is beaten with a stick, dust particles fall out due to:",
      q_hi: "जब किसी कालीन को छड़ी से पीटा जाता है, तो धूल के कण बाहर निकल जाते हैं। यह किस कारण होता है?",
      options: ["Inertia of Rest", "Inertia of Motion", "Inertia of Direction", "Newton's Third Law"],
      answer: 0,
      time: 5,
      trap: "The carpet moves with the stick, while dust particles remain at rest due to inertia.",
      difficulty: "easy"
    },
    {
      id: 902,
      class_name: "9",
      type: "build",
      hook: "🧩 BUILD IT",
      title: "Newton's Second Law",
      subject: "Physics",
      topic: "Force & Acceleration",
      q_en: "Construct the equation for Net Force in terms of Mass and Acceleration.",
      template: ["slot", "=", "slot", "×", "slot"],
      choices: ["F", "m", "a", "v", "p", "t"],
      answer: ["F", "m", "a"],
      time: 20,
      trap: "Force is directly proportional to the rate of change of momentum: F = ma.",
      difficulty: "medium"
    },
    {
      id: 903,
      class_name: "9",
      type: "mcq",
      hook: "💀 BOSS QUESTION",
      title: "Universal Gravitation",
      subject: "Physics",
      topic: "Gravitation",
      q_en: "If the distance between two objects is halved, the gravitational force becomes:",
      options: ["2 Times", "4 Times", "1/4th", "Unchanged"],
      answer: 1,
      time: 15,
      trap: "Inverse-Square Law: F ∝ 1/r². Halving r increases force by 2² = 4 times.",
      difficulty: "boss"
    },

    // --- CLASS 10 INTERACTIVE DECK ---
    {
      id: 1001,
      class_name: "10",
      type: "mcq",
      hook: "⚡ 5 SECOND CHALLENGE",
      title: "Spherical Mirrors",
      subject: "Physics",
      topic: "Light - Reflection",
      q_en: "If linear magnification m = -1 for a spherical concave mirror, the object is located:",
      options: ["At Infinity", "At Principal Focus (F)", "At Centre of Curvature (C)"],
      answer: 2,
      time: 5,
      trap: "Negative magnification means real & inverted. Size matches the object only at C.",
      difficulty: "easy"
    },
    {
      id: 1002,
      class_name: "10",
      type: "draw",
      sim_id: "phy_ray_draw",
      hook: "✏️ SKETCH THE RAY",
      title: "Law of Reflection",
      subject: "Physics",
      topic: "Light - Optics",
      q_en: "Drag on the sketchpad to draw the reflected ray for an incident angle of 45°.",
      time: 20,
      trap: "First Law of Reflection: Angle of incidence strictly equals angle of reflection (θ_i = θ_r).",
      difficulty: "medium"
    },
    {
      id: 1003,
      class_name: "10",
      type: "build",
      hook: "🧩 BUILD IT",
      title: "Ohm's Law",
      subject: "Physics",
      topic: "Electricity",
      q_en: "Assemble the correct terms for Potential Difference across a resistor.",
      template: ["slot", "=", "slot", "×", "slot"],
      choices: ["V", "I", "R", "P", "W", "Q"],
      answer: ["V", "I", "R"],
      time: 20,
      trap: "V = IR holds strictly when conductor temperature remains constant.",
      difficulty: "medium"
    },
    {
      id: 1004,
      class_name: "10",
      type: "mcq",
      hook: "💀 BOSS QUESTION",
      title: "Thermal Decomposition",
      subject: "Chemistry",
      topic: "Chemical Reactions",
      q_en: "Heating dry lead nitrate powder produces pungent brown fumes of:",
      options: ["Nitrogen Monoxide (NO)", "Nitrogen Dioxide (NO₂)", "Dinitrogen Pentoxide (N₂O₅)"],
      answer: 1,
      time: 15,
      trap: "2Pb(NO₃)₂ → 2PbO + 4NO₂↑ + O₂. The brown fumes are strictly NO₂.",
      difficulty: "boss"
    },

    // --- CLASS 11 & 12 ADVANCED DECK ---
    {
      id: 1201,
      class_name: "12",
      type: "sim",
      sim_id: "phy_wave_optics",
      hook: "🔬 INTERACTIVE LAB",
      title: "Young's Double-Slit",
      subject: "Physics",
      topic: "Wave Optics",
      q_en: "Adjust Slit Gap (d) and Wavelength (λ) to observe interference fringe spacing.",
      controls: [
        { id: "ctrl_wl", label: "Wavelength (λ)", min: 380, max: 750, step: 1, val: 532, unit: "nm" },
        { id: "ctrl_d", label: "Slit Gap (d)", min: 0.1, max: 0.8, step: 0.01, val: 0.25, unit: "mm" },
        { id: "ctrl_bigD", label: "Screen Dist (D)", min: 0.5, max: 2.5, step: 0.1, val: 1.2, unit: "m" }
      ],
      time: 30,
      trap: "Fringe Width β = λD/d. Decreasing slit gap d increases fringe width β.",
      difficulty: "medium"
    },
    {
      id: 1202,
      class_name: "12",
      type: "build",
      hook: "🧩 BUILD IT",
      title: "Joule's Heating Law",
      subject: "Physics",
      topic: "Current Electricity",
      q_en: "Construct the formula for electrical heat generated in a resistor over time t.",
      template: ["slot", "=", "slot", "²", "×", "slot", "×", "slot"],
      choices: ["H", "I", "R", "t", "V", "P"],
      answer: ["H", "I", "R", "t"],
      time: 25,
      trap: "Heat produced in time t is given by H = I²Rt.",
      difficulty: "medium"
    }
  ];

  // Dynamically enrich database questions with psychological hooks and clean titles
  function enrichAndShuffleReels(reelsList, targetClass) {
    const hookPool = [
      "⚡ 5 SECOND CHALLENGE",
      "🧠 THINK BEFORE YOU TAP",
      "⚠️ TOPPER TRAP",
      "🎯 ONLY 22% GET THIS",
      "💀 BOSS QUESTION",
      "🔍 SPOT THE CORE RULE"
    ];

    return (reelsList || []).map((reel, idx) => {
      // Generate clean dynamic hook if missing
      let hook = reel.hook;
      if (!hook || hook === "⚡ QUICK CHECK") {
        const timeLimit = parseInt(reel.time || 15, 10);
        if (reel.difficulty === 'boss') hook = "💀 BOSS QUESTION";
        else if (timeLimit <= 5) hook = "⚡ 5 SECOND CHALLENGE";
        else if (reel.type === 'build') hook = "🧩 BUILD IT";
        else if (reel.type === 'draw') hook = "✏️ SKETCH THE VECTOR";
        else if (reel.type === 'sim') hook = "🔬 INTERACTIVE LAB";
        else hook = hookPool[(reel.id || idx) % hookPool.length];
      }

      // Generate clean dynamic title if missing
      let title = reel.title;
      if (!title || title === "Can you solve this?" || title.toLowerCase().includes("beat the clock")) {
        const topicName = reel.topic || reel.subject || 'Concept';
        title = `${topicName} Matrix`;
      }

      if (reel.type !== 'mcq') {
        return {
          ...reel,
          hook,
          title,
          class_name: reel.class_name || targetClass || "10"
        };
      }

      // Parse & Shuffle MCQ options
      let rawOpts = reel.options;
      if (typeof rawOpts === 'string') {
        try { rawOpts = JSON.parse(rawOpts); } catch(e) { rawOpts = []; }
      }

      if (!Array.isArray(rawOpts) || rawOpts.length < 2) {
        if (reel.option_1 && reel.option_2) {
          rawOpts = [reel.option_1, reel.option_2, reel.option_3, reel.option_4].filter(Boolean);
        } else {
          return { ...reel, hook, title, class_name: reel.class_name || targetClass || "10" };
        }
      }

      const originalCorrectIdx = Number(reel.answer !== undefined ? reel.answer : (reel.correct_option || 0));

      const indexed = rawOpts.map((opt, oIdx) => ({
        text: opt,
        isCorrect: oIdx === originalCorrectIdx
      }));

      // Fisher-Yates Option Shuffle
      for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
      }

      return {
        ...reel,
        hook,
        title,
        class_name: reel.class_name || targetClass || "10",
        options: indexed.map(o => o.text),
        answer: Math.max(0, indexed.findIndex(o => o.isCorrect))
      };
    });
  }

  // Interleave interactive simulation, build, and draw challenges into the feed
  function interleaveInteractiveDeck(dbDeck, targetClass) {
    const classStr = String(targetClass || "10");
    const classInteractions = defaultInteractiveReels.filter(c => 
      String(c.class_name) === classStr || c.type === 'build' || c.type === 'sim' || c.type === 'draw'
    );

    if (!dbDeck || dbDeck.length === 0) {
      const filteredDefaults = defaultInteractiveReels.filter(c => String(c.class_name) === classStr);
      return filteredDefaults.length > 0 ? filteredDefaults : defaultInteractiveReels;
    }

    const mixed = [];
    let interIdx = 0;

    for (let i = 0; i < dbDeck.length; i++) {
      mixed.push(dbDeck[i]);
      if ((i + 1) % 2 === 0 && interIdx < classInteractions.length) {
        mixed.push(classInteractions[interIdx]);
        interIdx++;
      }
    }

    return mixed;
  }

  if (!supabaseUrl || !supabaseKey) {
    const target = req.query.target_class || "10";
    const fallbackDeck = interleaveInteractiveDeck([], target);
    return res.status(200).json({
      questions: [],
      dailyPuzzle: fallbackPuzzle,
      leaderboard: [],
      reelDeck: enrichAndShuffleReels(fallbackDeck, target)
    });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  };

  try {
    const { target_class } = req.query;
    const targetClassStr = String(target_class || "10");
    const today = new Date().toISOString().split('T')[0];

    const qPromise = fetch(`${supabaseUrl}/rest/v1/weekly_tests?select=*&limit=50`, { headers })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);

    const pPromise = fetch(`${supabaseUrl}/rest/v1/daily_puzzle?puzzle_date=eq.${today}&select=*`, { headers })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);

    const lPromise = fetch(`${supabaseUrl}/rest/v1/test_attempts?select=*&order=percentage.desc,created_at.desc&limit=7`, { headers })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);

    let reelQuery = `${supabaseUrl}/rest/v1/study_reels?select=*&order=id.asc&limit=150`;
    if (target_class) {
      reelQuery = `${supabaseUrl}/rest/v1/study_reels?class_name=eq.${target_class}&select=*&order=id.asc&limit=150`;
    }

    const rPromise = fetch(reelQuery, { headers })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);

    const [questions, puzzles, leaderboard, dbReels] = await Promise.all([
      qPromise,
      pPromise,
      lPromise,
      rPromise
    ]);

    const selectedPuzzle = (Array.isArray(puzzles) && puzzles.length > 0) ? puzzles[0] : fallbackPuzzle;
    const rawDbList = (Array.isArray(dbReels) && dbReels.length > 0) ? dbReels : [];
    
    // Interleave gameplay mechanics with DB questions
    const interleavedList = interleaveInteractiveDeck(rawDbList, targetClassStr);
    const processedReels = enrichAndShuffleReels(interleavedList, targetClassStr);

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');

    return res.status(200).json({
      questions: Array.isArray(questions) ? questions : [],
      dailyPuzzle: selectedPuzzle,
      leaderboard: Array.isArray(leaderboard) ? leaderboard : [],
      reelDeck: processedReels
    });
  } catch (error) {
    const target = req.query.target_class || "10";
    const fallbackDeck = interleaveInteractiveDeck([], target);
    return res.status(200).json({
      questions: [],
      dailyPuzzle: fallbackPuzzle,
      leaderboard: [],
      reelDeck: enrichAndShuffleReels(fallbackDeck, target)
    });
  }
}
