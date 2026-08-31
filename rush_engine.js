/* =====================================================
   ⚡ INVINCIBLE 360 - 60-SECOND BLITZ RUSH ENGINE
   - High-Energy Rapid-Fire 60s Timer
   - Dynamic Multipliers (x1.0 -> x4.0 Combo Scaling)
   - Strategic Power-Ups: 50/50, Cryo Freeze, Combo Shield, 2x XP
   - Personal Records (PB) & Post-Match Action Intelligence
===================================================== */

(function(window) {
  'use strict';

  const RUSH_QUESTIONS = [
    {
      q: "What is the SI unit of electric potential difference?",
      options: ["Ampere", "Volt", "Ohm", "Joule"],
      correct: 1,
      subject: "Physics",
      topic: "Electricity"
    },
    {
      q: "Which lens is used to correct myopia (nearsightedness)?",
      options: ["Convex Lens", "Concave Lens", "Bifocal Lens", "Cylindrical Lens"],
      correct: 1,
      subject: "Physics",
      topic: "Human Eye"
    },
    {
      q: "What gas is produced when zinc reacts with dilute sulfuric acid?",
      options: ["Oxygen", "Carbon Dioxide", "Hydrogen", "Nitrogen"],
      correct: 2,
      subject: "Chemistry",
      topic: "Chemical Reactions"
    },
    {
      q: "Which part of the nephron performs selective reabsorption?",
      options: ["Glomerulus", "Tubule", "Bowman's Capsule", "Collecting Duct"],
      correct: 1,
      subject: "Biology",
      topic: "Life Processes"
    },
    {
      q: "According to Ohm's law, if resistance doubles and voltage is constant, current:",
      options: ["Doubles", "Halves", "Quadruples", "Remains Same"],
      correct: 1,
      subject: "Physics",
      topic: "Electricity"
    },
    {
      q: "What is the pH of pure neutral water at 25°C?",
      options: ["5", "7", "9", "14"],
      correct: 1,
      subject: "Chemistry",
      topic: "Acids & Bases"
    }
  ];

  class RushEngine {
    constructor() {
      this.timer = 60;
      this.timerInterval = null;
      this.score = 0;
      this.combo = 0;
      this.currentQIdx = 0;
      this.activeQuestions = [];
      this.powerUps = {
        fiftyFifty: 1,
        freeze: 1,
        shield: 1,
        doubleXp: 1
      };
      this.activeShield = false;
      this.activeDoubleXP = false;
      this.isFrozen = false;
      this.personalBest = parseInt(localStorage.getItem('rush_personal_best') || '0', 10);
    }

    startRush() {
      this.timer = 60;
      this.score = 0;
      this.combo = 0;
      this.currentQIdx = 0;
      this.activeShield = false;
      this.activeDoubleXP = false;
      this.isFrozen = false;
      this.powerUps = { fiftyFifty: 1, freeze: 1, shield: 1, doubleXp: 1 };
      this.activeQuestions = [...RUSH_QUESTIONS].sort(() => Math.random() - 0.5);

      this.renderArena();
      this.startTimer();
      this.loadQuestion();
    }

    startTimer() {
      clearInterval(this.timerInterval);
      const timerEl = document.getElementById('rushTimerText');
      const fillEl = document.getElementById('rushTimerFill');

      this.timerInterval = setInterval(() => {
        if (!this.isFrozen) {
          this.timer--;
          if (timerEl) timerEl.textContent = `${this.timer}s`;
          if (fillEl) fillEl.style.width = `${(this.timer / 60) * 100}%`;

          if (this.timer <= 10 && timerEl) {
            timerEl.style.color = 'var(--accent-rose)';
            timerEl.classList.add('panic');
          }

          if (this.timer <= 0) {
            this.endRush();
          }
        }
      }, 1000);
    }

    renderArena() {
      const existing = document.getElementById('rushArenaModal');
      if (existing) existing.remove();

      const modalHtml = `
        <div id="rushArenaModal" class="modal-overlay" style="display:flex; z-index:100008; background:rgba(2,6,23,0.95); backdrop-filter:blur(24px);">
          <div style="width:min(460px,94%); display:flex; flex-direction:column; gap:12px;">
            
            <!-- Top HUD -->
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:10px 16px; border-radius:18px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:18px;">⚡</span>
                <div>
                  <div style="font-size:9px; font-weight:900; color:var(--accent-amber); letter-spacing:1px;">BLITZ RUSH</div>
                  <div id="rushScoreText" style="font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:900; color:#fff;">0 PTS</div>
                </div>
              </div>
              <div id="rushComboBadge" style="font-size:11px; font-weight:900; background:rgba(0,229,255,0.12); color:var(--accent-cyan); border:1px solid rgba(0,229,255,0.3); padding:4px 10px; border-radius:10px;">
                x1.0 COMBO
              </div>
              <div id="rushTimerText" style="font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:900; color:var(--accent-cyan);">60s</div>
            </div>

            <!-- Timer Progress -->
            <div style="height:4px; background:rgba(255,255,255,0.06); border-radius:999px; overflow:hidden;">
              <div id="rushTimerFill" style="height:100%; width:100%; background:linear-gradient(90deg, var(--accent-cyan), var(--accent-rose)); transition:width 1s linear;"></div>
            </div>

            <!-- Power-Ups Tray -->
            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">
              <button type="button" id="pu_5050" onclick="window.InvincibleRush.useFiftyFifty()" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:6px; color:#fff; font-size:10px; font-weight:800; cursor:pointer;">
                ✂️ 50/50 <span id="pu_5050_cnt">(1)</span>
              </button>
              <button type="button" id="pu_freeze" onclick="window.InvincibleRush.useFreeze()" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:6px; color:#fff; font-size:10px; font-weight:800; cursor:pointer;">
                🧊 Freeze <span id="pu_freeze_cnt">(1)</span>
              </button>
              <button type="button" id="pu_shield" onclick="window.InvincibleRush.useShield()" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:6px; color:#fff; font-size:10px; font-weight:800; cursor:pointer;">
                🛡️ Shield <span id="pu_shield_cnt">(1)</span>
              </button>
              <button type="button" id="pu_2x" onclick="window.InvincibleRush.useDoubleXP()" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:6px; color:#fff; font-size:10px; font-weight:800; cursor:pointer;">
                ✨ 2x XP <span id="pu_2x_cnt">(1)</span>
              </button>
            </div>

            <!-- Question Card -->
            <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.08); border-radius:22px; padding:20px; min-height:220px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <span id="rushSubjectTag" style="font-size:10px; font-weight:900; color:var(--accent-amber); letter-spacing:0.8px;">PHYSICS</span>
                <div id="rushQuestionText" style="font-size:15px; font-weight:800; color:#fff; line-height:1.45; margin-top:6px;">Loading question...</div>
              </div>
              <div id="rushOptionsContainer" style="display:flex; flex-direction:column; gap:8px; margin-top:16px;"></div>
            </div>

            <button type="button" onclick="window.InvincibleRush.quitRush()" style="background:transparent; border:none; color:#64748b; font-size:11px; font-weight:700; cursor:pointer; text-align:center;">Cancel Run</button>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    loadQuestion() {
      const q = this.activeQuestions[this.currentQIdx % this.activeQuestions.length];
      const qText = document.getElementById('rushQuestionText');
      const tagText = document.getElementById('rushSubjectTag');
      const container = document.getElementById('rushOptionsContainer');

      if (qText) qText.textContent = q.q;
      if (tagText) tagText.textContent = `${q.subject.toUpperCase()} • ${q.topic.toUpperCase()}`;
      if (!container) return;

      container.innerHTML = q.options.map((opt, idx) => `
        <button type="button" class="reel-opt-btn" onclick="window.InvincibleRush.handleAnswer(${idx})" style="width:100%; padding:12px 14px; font-size:13px;">
          <span>${opt}</span>
          <span style="font-size:11px; opacity:0.5;">#${idx + 1}</span>
        </button>
      `).join('');
    }

    handleAnswer(selectedIdx) {
      const q = this.activeQuestions[this.currentQIdx % this.activeQuestions.length];
      const isCorrect = selectedIdx === q.correct;
      const buttons = document.querySelectorAll('#rushOptionsContainer .reel-opt-btn');

      buttons.forEach((b, i) => {
        b.disabled = true;
        if (i === q.correct) b.classList.add('correct');
        else if (i === selectedIdx && !isCorrect) b.classList.add('wrong');
      });

      if (isCorrect) {
        if (typeof playDing === 'function') playDing();
        this.combo++;
        const multiplier = Math.min(4.0, 1.0 + (this.combo * 0.3));
        const pts = Math.round(50 * multiplier * (this.activeDoubleXP ? 2 : 1));
        this.score += pts;

        const comboBadge = document.getElementById('rushComboBadge');
        if (comboBadge) comboBadge.textContent = `x${multiplier.toFixed(1)} COMBO 🔥`;
      } else {
        if (!this.activeShield) {
          if (typeof playBuzz === 'function') playBuzz();
          this.combo = 0;
          const comboBadge = document.getElementById('rushComboBadge');
          if (comboBadge) comboBadge.textContent = `x1.0 COMBO`;
        } else {
          this.activeShield = false; // Shield saved the combo once
          alert("🛡️ Shield Protected Your Combo Streak!");
        }
      }

      const scoreEl = document.getElementById('rushScoreText');
      if (scoreEl) scoreEl.textContent = `${this.score} PTS`;

      setTimeout(() => {
        this.currentQIdx++;
        this.loadQuestion();
      }, 350);
    }

    /* --------------------------------------------------
       POWER-UP ACTIONS
    -------------------------------------------------- */
    useFiftyFifty() {
      if (this.powerUps.fiftyFifty <= 0) return;
      this.powerUps.fiftyFifty--;
      const btn = document.getElementById('pu_5050');
      const cnt = document.getElementById('pu_5050_cnt');
      if (btn) btn.disabled = true;
      if (cnt) cnt.textContent = '(0)';

      const q = this.activeQuestions[this.currentQIdx % this.activeQuestions.length];
      const buttons = document.querySelectorAll('#rushOptionsContainer .reel-opt-btn');
      let removed = 0;
      buttons.forEach((b, i) => {
        if (i !== q.correct && removed < 2) {
          b.style.visibility = 'hidden';
          removed++;
        }
      });
      if (typeof playDing === 'function') playDing();
    }

    useFreeze() {
      if (this.powerUps.freeze <= 0) return;
      this.powerUps.freeze--;
      const btn = document.getElementById('pu_freeze');
      const cnt = document.getElementById('pu_freeze_cnt');
      if (btn) btn.disabled = true;
      if (cnt) cnt.textContent = '(0)';

      this.isFrozen = true;
      const timerEl = document.getElementById('rushTimerText');
      if (timerEl) timerEl.style.color = '#38bdf8';

      setTimeout(() => {
        this.isFrozen = false;
        if (timerEl) timerEl.style.color = 'var(--accent-cyan)';
      }, 5000);
      if (typeof playDing === 'function') playDing();
    }

    useShield() {
      if (this.powerUps.shield <= 0) return;
      this.powerUps.shield--;
      this.activeShield = true;
      const btn = document.getElementById('pu_shield');
      const cnt = document.getElementById('pu_shield_cnt');
      if (btn) btn.disabled = true;
      if (cnt) cnt.textContent = '(0)';
      if (typeof playDing === 'function') playDing();
    }

    useDoubleXP() {
      if (this.powerUps.doubleXp <= 0) return;
      this.powerUps.doubleXp--;
      this.activeDoubleXP = true;
      const btn = document.getElementById('pu_2x');
      const cnt = document.getElementById('pu_2x_cnt');
      if (btn) btn.disabled = true;
      if (cnt) cnt.textContent = '(0)';
      if (typeof playDing === 'function') playDing();
    }

    /* --------------------------------------------------
       GAME OVER & RESULT INTELLIGENCE
    -------------------------------------------------- */
    endRush() {
      clearInterval(this.timerInterval);
      const isNewPB = this.score > this.personalBest;
      if (isNewPB) {
        this.personalBest = this.score;
        localStorage.setItem('rush_personal_best', this.score.toString());
      }

      // Reward XP through Global Telemetry
      const earnedXP = Math.round(this.score * 0.15);
      let curXP = parseInt(localStorage.getItem('student_xp') || '680', 10) + earnedXP;
      localStorage.setItem('student_xp', curXP.toString());
      const xpEl = document.getElementById('xpCounter');
      if (xpEl) xpEl.textContent = curXP;

      if (window.InvincibleTelemetry) {
        window.InvincibleTelemetry.emit('ARENA_FINISHED', {
          subject: 'Science',
          chapter: 'Blitz Rush',
          won: this.score >= 300,
          accuracy: Math.min(100, Math.round((this.score / (this.currentQIdx * 50 || 1)) * 100)),
          comboStreak: this.combo
        });
      }

      const modal = document.getElementById('rushArenaModal');
      if (!modal) return;

      modal.innerHTML = `
        <div style="width:min(440px,94%); background:#090e1c; border:1px solid rgba(255,255,255,0.1); border-radius:26px; padding:24px; text-align:center;">
          <div style="font-size:36px; margin-bottom:4px;">${isNewPB ? '👑' : '🏁'}</div>
          <h2 style="font-family:'Space Grotesk',sans-serif; font-size:24px; font-weight:900; color:#fff; margin:0;">
            ${isNewPB ? 'NEW PERSONAL BEST!' : 'RUSH COMPLETED'}
          </h2>
          <div style="font-size:12px; color:#94a3b8; margin-top:4px;">60-Second Challenge Complete</div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:20px 0;">
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); padding:14px; border-radius:16px;">
              <div style="font-size:24px; font-weight:900; color:var(--accent-cyan); font-family:'Space Grotesk',sans-serif;">${this.score}</div>
              <div style="font-size:10px; font-weight:800; color:#64748b;">FINAL SCORE</div>
            </div>
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); padding:14px; border-radius:16px;">
              <div style="font-size:24px; font-weight:900; color:var(--accent-amber); font-family:'Space Grotesk',sans-serif;">+${earnedXP}</div>
              <div style="font-size:10px; font-weight:800; color:#64748b;">XP EARNED</div>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:8px;">
            <button type="button" class="solid-cta" onclick="window.InvincibleRush.startRush()">PLAY AGAIN 🔄</button>
            <button type="button" class="solid-cta" onclick="window.InvincibleRush.quitRush()" style="background:rgba(255,255,255,0.05) !important; color:#fff !important;">CLOSE TO DASHBOARD</button>
          </div>
        </div>
      `;

      if (typeof confetti === 'function') confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    }

    quitRush() {
      clearInterval(this.timerInterval);
      const modal = document.getElementById('rushArenaModal');
      if (modal) modal.remove();
    }
  }

  window.InvincibleRush = new RushEngine();

})(window);
