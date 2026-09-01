/* =====================================================
   🧠 INVINCIBLE 360 - AI ORCHESTRATOR
   - Listens for telemetry intervention requests
   - Generates contextual "2-Minute Fix" micro-lessons
   - Manages the intervention UI state
   - Resolves mistakes upon successful completion
===================================================== */

(function(window) {
  'use strict';

  class AIOrchestrator {
    constructor() {
      this.currentFixState = null;
      this.initListeners();
    }

    initListeners() {
      // Listen directly to the central nervous system
      if (window.InvincibleTelemetry) {
        window.InvincibleTelemetry.on('2_MIN_FIX_REQUESTED', (payload) => this.initiateTwoMinuteFix(payload));
      }

      // Fallback for global window events
      window.addEventListener('invincible:event', (e) => {
        if (e.detail && e.detail.type === '2_MIN_FIX_REQUESTED') {
          this.initiateTwoMinuteFix(e.detail.payload);
        }
      });
    }

    /* --------------------------------------------------
       1. INTERCEPT & PREPARE INTERVENTION
    -------------------------------------------------- */
    async initiateTwoMinuteFix(payload) {
      console.log("[AI Orchestrator] Intercepted Request:", payload);
      this.currentFixState = payload;

      // Ensure we are on the coach tab (create this container in your HTML if it doesn't exist)
      const coachContainer = document.getElementById('aiCoachContainer');
      if (!coachContainer) {
        console.warn("Missing 'aiCoachContainer' in DOM. Please create a div with this ID in your coach tab.");
        return;
      }

      // 1. Render Loading UI (Glassmorphic style)
      coachContainer.innerHTML = `
        <div class="fix-loading-state" style="padding:40px 20px; text-align:center; background:rgba(15,23,42,0.6); border:1px solid rgba(0,229,255,0.2); border-radius:16px; backdrop-filter:blur(10px);">
            <div style="font-size:32px; animation: pulse 1.5s infinite;">🧠</div>
            <h3 style="color:var(--accent-cyan, #00f3ff); font-family:'Space Grotesk', sans-serif; margin:12px 0 4px;">Analyzing Weakness...</h3>
            <p style="color:#94a3b8; font-size:13px; font-weight:700;">Generating 2-Minute Fix for ${payload.topic}</p>
        </div>
      `;

      // 2. Fetch the intervention from your backend/AI API
      try {
        const fixData = await this.fetchFixFromAI(payload);
        this.renderFixUI(coachContainer, fixData);
      } catch (err) {
        console.error("AI Generation Failed:", err);
        coachContainer.innerHTML = `
          <div style="padding:20px; text-align:center; color:#f43f5e; background:rgba(244,63,94,0.1); border-radius:12px;">
            Failed to generate lesson. Please check your connection and try again.
          </div>
        `;
      }
    }
    /* --------------------------------------------------
       2. AI GENERATION (SECURE API BRIDGE)
    -------------------------------------------------- */
    async fetchFixFromAI(payload) {
      try {
        // Point this to your secure backend endpoint
        const response = await fetch('/api/generate-fix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: payload.subject,
            topic: payload.topic,
            originalQuestion: payload.originalQuestion,
            coreMisconception: payload.coreMisconception
          })
        });

        if (!response.ok) {
          throw new Error(`API returned status: ${response.status}`);
        }

        // The backend must return a strict JSON object containing: 
        // { explanation, example, question, options, correctIndex }
        const aiData = await response.json();
        return aiData;

      } catch (error) {
        console.error("[AI Orchestrator] Secure Fetch Failed:", error);
        throw error; // Let the initiator handle the error UI
      }
    }

    

    /* --------------------------------------------------
       3. RENDER THE INTERVENTION UI
    -------------------------------------------------- */
    renderFixUI(container, fixData) {
      this.currentFixState.correctIndex = fixData.correctIndex;

      container.innerHTML = `
        <div class="fix-active-state" style="animation: slideUp 0.4s ease-out; background:linear-gradient(180deg, rgba(15,23,42,0.95), rgba(3,7,18,0.98)); border:1px solid rgba(255,255,255,0.1); border-top:3px solid var(--accent-cyan, #00f3ff); border-radius:20px; padding:24px; box-shadow:0 12px 40px rgba(0,0,0,0.5);">
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <span style="background:rgba(0,229,255,0.15); color:var(--accent-cyan, #00f3ff); padding:4px 10px; border-radius:8px; font-weight:900; font-size:11px; letter-spacing:1px;">⚡ 2-MIN FIX</span>
                <span style="color:#64748b; font-size:11px; font-weight:700;">${this.currentFixState.subject} &bull; ${this.currentFixState.topic}</span>
            </div>

            <div style="margin-bottom:20px;">
                <h4 style="color:#fff; font-size:15px; margin-bottom:8px;">1. The Concept</h4>
                <p style="color:#cbd5e1; font-size:14px; line-height:1.6; background:rgba(255,255,255,0.03); padding:12px; border-radius:10px;">${fixData.explanation}</p>
            </div>

            <div style="margin-bottom:24px;">
                <h4 style="color:#fff; font-size:15px; margin-bottom:8px;">2. Worked Example</h4>
                <p style="color:#cbd5e1; font-size:14px; line-height:1.6; background:rgba(255,255,255,0.03); padding:12px; border-radius:10px; border-left:2px solid #10b981;">${fixData.example}</p>
            </div>

            <div style="margin-bottom:16px;">
                <h4 style="color:var(--accent-rose, #f43f5e); font-size:15px; margin-bottom:12px;">3. Prove Your Mastery</h4>
                <p style="color:#fff; font-size:15px; font-weight:800; margin-bottom:16px;">${fixData.question}</p>
                
                <div style="display:flex; flex-direction:column; gap:8px;" id="fixOptionsGrid">
                    ${fixData.options.map((opt, idx) => `
                        <button onclick="window.InvincibleAI.handleFixAnswer(${idx}, this)" style="text-align:left; padding:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:#fff; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s;">
                            ${opt}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <div id="fixResultHUD" style="display:none; text-align:center; padding-top:16px; border-top:1px solid rgba(255,255,255,0.1);"></div>
        </div>
      `;
    }

    /* --------------------------------------------------
       4. EVALUATE & RESOLVE
    -------------------------------------------------- */
    handleFixAnswer(selectedIndex, btnElement) {
      const isCorrect = selectedIndex === this.currentFixState.correctIndex;
      const options = document.getElementById('fixOptionsGrid').querySelectorAll('button');
      
      // Lock options
      options.forEach((btn, idx) => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        if (idx === this.currentFixState.correctIndex) {
          btn.style.opacity = '1';
          btn.style.background = 'rgba(16,185,129,0.15)';
          btn.style.borderColor = '#10b981';
        }
      });

      const hud = document.getElementById('fixResultHUD');
      hud.style.display = 'block';

      if (isCorrect) {
        if (typeof playDing === 'function') playDing();
        if (typeof confetti === 'function') confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        
        hud.innerHTML = `
            <div style="color:#10b981; font-weight:900; font-size:18px; margin-bottom:8px;">✓ CONCEPT REPAIRED</div>
            <div style="color:#94a3b8; font-size:12px; margin-bottom:16px;">Mistake destroyed. Mastery restored.</div>
            <button onclick="window.InvincibleAI.closeFix()" style="padding:10px 24px; background:#10b981; color:#000; border:none; border-radius:8px; font-weight:900; cursor:pointer;">CONTINUE LEARNING</button>
        `;

        // 🧠 TELEMETRY: Broadcast fix completion
        if (window.InvincibleTelemetry) {
            window.InvincibleTelemetry.emit('2_MIN_FIX_COMPLETED', {
                subject: this.currentFixState.subject,
                topic: this.currentFixState.topic
            });
        }

        // Bridge back to Mistake Vault to mark it permanently resolved
        if (window.InvincibleVault && this.currentFixState.mistakeId) {
            window.InvincibleVault.markResolved(this.currentFixState.mistakeId);
        }

      } else {
        if (typeof playBuzz === 'function') playBuzz();
        btnElement.style.opacity = '1';
        btnElement.style.background = 'rgba(244,63,94,0.15)';
        btnElement.style.borderColor = '#f43f5e';

        hud.innerHTML = `
            <div style="color:#f43f5e; font-weight:900; font-size:18px; margin-bottom:8px;">✕ STILL UNSTABLE</div>
            <div style="color:#94a3b8; font-size:12px; margin-bottom:16px;">This mistake will remain in your vault for another attempt later.</div>
            <button onclick="window.InvincibleAI.closeFix()" style="padding:10px 24px; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:8px; font-weight:900; cursor:pointer;">BACK TO DASHBOARD</button>
        `;
      }
    }

    closeFix() {
      const container = document.getElementById('aiCoachContainer');
      if (container) container.innerHTML = '';
      if (typeof switchTab === 'function') switchTab('home');
      this.currentFixState = null;
    }
  }

  // Initialize Global Singleton
  window.InvincibleAI = new AIOrchestrator();

})(window);
