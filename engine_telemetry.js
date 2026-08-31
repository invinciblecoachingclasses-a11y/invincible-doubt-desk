/* =====================================================
   ⚡ INVINCIBLE 360 - UNIFIED EVENT & MASTERY ENGINE
   Core Modules:
   1. Centralized Event Bus (InvincibleTelemetry.emit)
   2. Dynamic Concept Mastery Tracking & Sub-skill Matrix
   3. Spaced-Repetition Knowledge Decay Algorithm (Ebbinghaus)
   4. Unified XP, Streak & Progression Manager
   5. Intelligent "Next Best Move" Recommendation Generator
===================================================== */

(function(window) {
  'use strict';

  const STORAGE_KEY_MASTERY = 'invincible_concept_mastery';
  const STORAGE_KEY_EVENTS = 'invincible_event_log';
  const STORAGE_KEY_RECS = 'invincible_recommendations';

  const DEFAULT_SKILLS = {
    concepts: 70,
    numericals: 60,
    diagrams: 65,
    application: 60
  };

  class TelemetryEngine {
    constructor() {
      this.mastery = this.loadMastery();
      this.eventQueue = this.loadEvents();
      this.subscribers = {};
      this.initDecayEngine();
    }

    /* --------------------------------------------------
       1. EVENT BUS & EMITTER
    -------------------------------------------------- */
    on(eventName, callback) {
      if (!this.subscribers[eventName]) {
        this.subscribers[eventName] = [];
      }
      this.subscribers[eventName].push(callback);
    }

    emit(eventName, payload = {}) {
      const eventRecord = {
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: eventName,
        timestamp: Date.now(),
        payload: payload
      };

      this.logEvent(eventRecord);
      this.processTelemetry(eventRecord);

      if (this.subscribers[eventName]) {
        this.subscribers[eventName].forEach(cb => {
          try { cb(payload, eventRecord); } catch(e) { console.error(`[Telemetry Error: ${eventName}]`, e); }
        });
      }

      // Sync across open tabs
      window.dispatchEvent(new CustomEvent('invincible:event', { detail: eventRecord }));
    }

    logEvent(eventRecord) {
      this.eventQueue.push(eventRecord);
      if (this.eventQueue.length > 250) this.eventQueue.shift(); // Keep last 250 events locally
      try {
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(this.eventQueue));
      } catch(e) {}
    }

    /* --------------------------------------------------
       2. TELEMETRY & MASTERY PROCESSING
    -------------------------------------------------- */
    processTelemetry(event) {
      const { type, payload } = event;

      switch (type) {
        case 'REEL_RESOLVED':
          this.updateReelMastery(payload);
          break;

        case 'ARENA_FINISHED':
          this.updateArenaMastery(payload);
          break;

        case 'LAB_COMPLETED':
          this.updateLabMastery(payload);
          break;

        case 'TEST_SUBMITTED':
          this.updateTestMastery(payload);
          break;

        case 'MISTAKE_RECOVERED':
          this.updateMistakeRecovery(payload);
          break;
      }

      this.saveMastery();
    }

    updateReelMastery(payload) {
  const { subject, topic, isCorrect, timeTaken, isBoss, question, yourAnswer, correctAnswer, explanation } = payload;
  const entry = this.getTopicEntry(subject, topic);
  entry.attempts += 1;
  
  if (isCorrect) {
    entry.correct += 1;
    entry.mastery = Math.min(100, entry.mastery + 6);
    entry.skills.concepts = Math.min(100, entry.skills.concepts + 6);
  } else {
    entry.mastery = Math.max(15, entry.mastery - 4);
    entry.skills.concepts = Math.max(10, entry.skills.concepts - 4);
    
    // Auto-log full mistake context with feedback
    if (window.InvincibleVault) {
      window.InvincibleVault.recordMistake({
        subject: subject || 'Science',
        topic: topic || 'General Concept',
        question: question,
        yourAnswer: yourAnswer,
        correctAnswer: correctAnswer,
        category: 'Concept Trap',
        explanation: explanation || 'Review the core formula and verify sign conventions.'
      });
    }
  }

  entry.lastPracticed = Date.now();
}


    updateArenaMastery({ subject, chapter, won, accuracy, comboStreak }) {
      const entry = this.getTopicEntry(subject, chapter || 'General Syllabus');
      entry.attempts += 5;
      
      const delta = won ? (accuracy >= 80 ? 8 : 5) : -3;
      entry.mastery = Math.max(10, Math.min(100, entry.mastery + delta));
      entry.skills.application = Math.max(10, Math.min(100, entry.skills.application + delta));
      if (comboStreak >= 3) {
        entry.skills.numericals = Math.min(100, entry.skills.numericals + 6);
      }
      entry.lastPracticed = Date.now();
    }

    updateLabMastery({ subject, labName, hypothesisCorrect }) {
      const entry = this.getTopicEntry(subject || 'Science', labName);
      const gain = hypothesisCorrect ? 12 : 6;
      entry.mastery = Math.min(100, entry.mastery + gain);
      entry.skills.diagrams = Math.min(100, entry.skills.diagrams + gain);
      entry.skills.application = Math.min(100, entry.skills.application + gain);
      entry.lastPracticed = Date.now();
    }

    updateTestMastery({ subject, chapter, percentage, attempted, correct }) {
      const entry = this.getTopicEntry(subject, chapter);
      entry.attempts += attempted;
      entry.correct += correct;

      const testDelta = Math.round((percentage - entry.mastery) * 0.25);
      entry.mastery = Math.max(10, Math.min(100, entry.mastery + testDelta));
      entry.skills.numericals = Math.max(10, Math.min(100, entry.skills.numericals + (percentage >= 70 ? 8 : -6)));
      entry.lastPracticed = Date.now();
    }

    updateMistakeRecovery({ subject, topic, fixedCount }) {
      const entry = this.getTopicEntry(subject, topic);
      const boost = (fixedCount || 1) * 6;
      entry.mastery = Math.min(100, entry.mastery + boost);
      entry.lastPracticed = Date.now();
    }

    getTopicEntry(subject = 'Science', topic = 'General') {
      const subKey = String(subject).trim();
      const topKey = String(topic).trim();

      if (!this.mastery[subKey]) this.mastery[subKey] = {};
      if (!this.mastery[subKey][topKey]) {
        this.mastery[subKey][topKey] = {
          mastery: 50, // Baseline start
          attempts: 0,
          correct: 0,
          skills: { ...DEFAULT_SKILLS },
          lastPracticed: Date.now()
        };
      }
      return this.mastery[subKey][topKey];
    }

    /* --------------------------------------------------
       3. SPACED REPETITION & KNOWLEDGE DECAY (EBBINGHAUS)
    -------------------------------------------------- */
    initDecayEngine() {
      const now = Date.now();
      const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;
      let decayOccurred = false;

      Object.keys(this.mastery).forEach(sub => {
        Object.keys(this.mastery[sub]).forEach(top => {
          const item = this.mastery[sub][top];
          const daysInactive = (now - item.lastPracticed) / FIVE_DAYS;
          
          if (daysInactive >= 1 && item.mastery > 20) {
            const decayAmount = Math.min(15, Math.floor(daysInactive * 3));
            item.mastery = Math.max(20, item.mastery - decayAmount);
            item.decayFlag = true;
            decayOccurred = true;
          }
        });
      });

      if (decayOccurred) this.saveMastery();
    }

    /* --------------------------------------------------
       4. INTELLIGENT "NEXT BEST MOVE" ENGINE
    -------------------------------------------------- */
    getNextBestMove() {
      let lowestMastery = 101;
      let targetMove = null;

      // 1. Scan for decayed or critically low concepts (<65%)
      Object.keys(this.mastery).forEach(sub => {
        Object.keys(this.mastery[sub]).forEach(top => {
          const item = this.mastery[sub][top];
          if (item.mastery < lowestMastery) {
            lowestMastery = item.mastery;
            targetMove = {
              type: 'MASTERY_RECOVERY',
              subject: sub,
              topic: top,
              mastery: item.mastery,
              reason: item.decayFlag 
                ? `You haven't practiced ${top} in 5+ days. Memory retention is decaying.` 
                : `Your mastery in ${top} is at ${item.mastery}%. A 2-min drill will level it up.`,
              actionTitle: `Master ${top}`,
              actionTab: 'reels'
            };
          }
        });
      });

      // 2. Default fallback if no low scores exist
      if (!targetMove) {
        targetMove = {
          type: 'DAILY_CHALLENGE',
          subject: 'Science',
          topic: 'Electricity & Circuits',
          mastery: 75,
          reason: 'Complete today’s high-yield challenge to maintain your rank on the leaderboard.',
          actionTitle: 'Launch 2-Min Speed Drill',
          actionTab: 'arena'
        };
      }

      return targetMove;
    }

    /* --------------------------------------------------
       5. PERSISTENCE HELPERS
    -------------------------------------------------- */
    loadMastery() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_MASTERY);
        return saved ? JSON.parse(saved) : {};
      } catch(e) { return {}; }
    }

    saveMastery() {
      try {
        localStorage.setItem(STORAGE_KEY_MASTERY, JSON.stringify(this.mastery));
      } catch(e) {}
    }

    loadEvents() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
        return saved ? JSON.parse(saved) : [];
      } catch(e) { return []; }
    }
  }

  // Global Singleton Initialization
  window.InvincibleTelemetry = new TelemetryEngine();

})(window);
