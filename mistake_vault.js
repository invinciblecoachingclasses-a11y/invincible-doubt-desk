/* =====================================================
   ⚡ INVINCIBLE 360 - MISTAKE VAULT & RECOVERY ENGINE
   - Auto-Logs Failed Interactions Across All Modes
   - Cognitive Distractor Classification
   - "Battle My Mistakes" Adaptive Recovery Mode
   - Concept Mastery Restoration (+XP)
===================================================== */

(function(window) {
  'use strict';

  const STORAGE_KEY_MISTAKES = 'invincible_mistake_vault';

  class MistakeVaultEngine {
    constructor() {
      this.mistakes = this.loadVault();
      this.initListeners();
    }

    loadVault() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_MISTAKES);
        return saved ? JSON.parse(saved) : [];
      } catch(e) { return []; }
    }

    saveVault() {
      try {
        localStorage.setItem(STORAGE_KEY_MISTAKES, JSON.stringify(this.mistakes));
      } catch(e) {}
    }

    initListeners() {
      if (window.InvincibleTelemetry) {
        window.InvincibleTelemetry.on('MISTAKE_LOGGED', (payload) => {
          this.recordMistake(payload);
        });
      }

      window.addEventListener('invincible:event', (e) => {
        if (e.detail && e.detail.type === 'MISTAKE_LOGGED') {
          this.recordMistake(e.detail.payload);
        }
      });
    }

    recordMistake({ subject, topic, question, yourAnswer, correctAnswer, category, explanation }) {
      // Avoid duplicate active entries for the exact same question
      const existingIdx = this.mistakes.findIndex(m => m.question === question && !m.resolved);
      if (existingIdx !== -1) {
        this.mistakes[existingIdx].attempts = (this.mistakes[existingIdx].attempts || 1) + 1;
        this.mistakes[existingIdx].timestamp = Date.now();
        this.saveVault();
        return;
      }

      const mistakeEntry = {
        id: 'mstk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        subject: subject || 'Science',
        topic: topic || 'General',
        question: question || 'Sample Problem',
        yourAnswer: yourAnswer || 'Incorrect choice',
        correctAnswer: correctAnswer || 'Correct formula',
        category: category || 'Concept Confusion',
        explanation: explanation || 'Review fundamental laws and sign conventions.',
        timestamp: Date.now(),
        attempts: 1,
        resolved: false
      };

      this.mistakes.unshift(mistakeEntry);
      if (this.mistakes.length > 50) this.mistakes.pop(); // Keep 50 high-priority mistakes
      this.saveVault();
    }

    getActiveMistakes() {
      return this.mistakes.filter(m => !m.resolved);
    }

    /* --------------------------------------------------
       UI: MISTAKE VAULT DRAWER
    -------------------------------------------------- */
    openVaultModal() {
      const existing = document.getElementById('mistakeVaultModal');
      if (existing) existing.remove();

      const activeList = this.getActiveMistakes();

      const itemsHtml = activeList.length === 0 
        ? `<div style="text-align:center; padding:32px 16px; color:#64748b;">
             <div style="font-size:36px; margin-bottom:8px;">🛡️</div>
             <div style="font-weight:900; color:#fff; font-size:16px;">Vault is Pristine!</div>
             <div style="font-size:12px; margin-top:4px;">No active concept errors recorded. Keep up the high accuracy!</div>
           </div>`
        : activeList.map((m, idx) => `
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(244,63,94,0.25); border-radius:14px; padding:14px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:10px; font-weight:900; color:var(--accent-rose); background:rgba(244,63,94,0.12); padding:2px 8px; border-radius:6px;">${m.category}</span>
              <span style="font-size:10px; color:#64748b; font-weight:700;">${m.subject} &bull; ${m.topic}</span>
            </div>
            <div style="font-size:13px; font-weight:800; color:#fff; line-height:1.4; margin:6px 0;">${m.question}</div>
            
            <div style="display:flex; gap:8px; font-size:11px; margin:8px 0; font-weight:700;">
              <span style="color:#f43f5e; background:rgba(244,63,94,0.08); padding:4px 8px; border-radius:6px; flex:1;">❌ You: ${m.yourAnswer}</span>
              <span style="color:#10b981; background:rgba(16,185,129,0.08); padding:4px 8px; border-radius:6px; flex:1;">✓ Fix: ${m.correctAnswer}</span>
            </div>
            <div style="font-size:10.5px; color:#94a3b8; line-height:1.4;">💡 <b>Key Rule:</b> ${m.explanation}</div>
          </div>
        `).join('');

      const modalHtml = `
        <div id="mistakeVaultModal" class="bottom-sheet-overlay open" onclick="window.InvincibleVault.closeVaultModal()" style="z-index:100010;">
          <div class="bottom-sheet-content" onclick="event.stopPropagation()" style="max-height:85vh; overflow-y:auto;">
            <div class="sheet-handle"></div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <div>
                <h3 style="font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:900; color:#fff; margin:0;">🚨 Mistake Vault</h3>
                <div style="font-size:11px; color:#94a3b8; font-weight:700;">${activeList.length} concepts needing recovery</div>
              </div>
              ${activeList.length > 0 ? `
                <button type="button" onclick="window.InvincibleVault.startBattleMyMistakes()" style="background:linear-gradient(135deg, var(--accent-rose), #e11d48); color:#fff; border:none; padding:8px 14px; border-radius:10px; font-weight:900; font-size:11px; cursor:pointer; box-shadow:0 4px 15px rgba(244,63,94,0.4);">
                  ⚔️ BATTLE MISTAKES
                </button>` : ''}
            </div>

            <div style="display:flex; flex-direction:column; gap:4px;">
              ${itemsHtml}
            </div>

            <button type="button" class="solid-cta" onclick="window.InvincibleVault.closeVaultModal()" style="margin-top:16px; background:rgba(255,255,255,0.06) !important; color:#fff !important;">CLOSE VAULT</button>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      if (typeof playDing === 'function') playDing();
    }

    closeVaultModal() {
      const modal = document.getElementById('mistakeVaultModal');
      if (modal) modal.remove();
    }

        /* --------------------------------------------------
       BATTLE MY MISTAKES (RECOVERY DRILL)
    -------------------------------------------------- */
    startBattleMyMistakes() {
      this.closeVaultModal();
      const activeList = this.getActiveMistakes();
      if (!activeList.length) return alert("No active mistakes to battle!");

      // 1. Find the highest priority mistake (most attempts or oldest)
      const priorityMistake = activeList.sort((a, b) => (b.attempts || 0) - (a.attempts || 0))[0];

      // 2. Prepare payload for the AI Orchestrator to generate a 2-Minute Fix
      const fixPayload = {
          subject: priorityMistake.subject,
          topic: priorityMistake.topic,
          originalQuestion: priorityMistake.question,
          coreMisconception: priorityMistake.explanation,
          mistakeId: priorityMistake.id
      };

      // 3. Emit event to trigger the AI Coach / 2-Min Fix
      if (window.InvincibleTelemetry) {
          window.InvincibleTelemetry.emit('2_MIN_FIX_REQUESTED', fixPayload);
      }

      // Route directly to the AI Coach tab where the fix will be generated
      if (typeof switchTab === 'function') {
        switchTab('coach');
      } else {
        alert(`⚡ BATTLE MODE: AI is preparing a 2-Minute Fix for your weakness in ${priorityMistake.topic}...`);
      }
    }

    markResolved(mistakeId) {
      const item = this.mistakes.find(m => m.id === mistakeId);
      if (item) {
        item.resolved = true;
        this.saveVault();

        // 🧠 TELEMETRY INJECTION: Massive mastery recovery boost
        if (window.InvincibleTelemetry) {
          window.InvincibleTelemetry.emit('MISTAKE_RECOVERED', {
            subject: item.subject,
            topic: item.topic,
            fixedCount: 1
          });
        }

        // Gamification: Reward student for fixing errors
        if (typeof addStudentXP === 'function') {
            addStudentXP(30); 
            console.log(`[Vault] Mistake ${mistakeId} resolved. +30 XP awarded.`);
        }
      }
    }

  }

  window.InvincibleVault = new MistakeVaultEngine();

})(window);
