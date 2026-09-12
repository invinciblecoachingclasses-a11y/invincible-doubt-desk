/* =====================================================
   🧠 INVINCIBLE 360 - AI ORCHESTRATOR
   - 2-Minute Fix intervention
   - Lightweight intervention UI
   - Connects Telemetry → AI Fix → Mistake Vault
===================================================== */

(function(window) {
  'use strict';

  class AIOrchestrator {

    constructor() {
      this.currentFixState = null;
      this.initListeners();
    }


    /* --------------------------------------------------
       LISTEN FOR 2-MINUTE FIX REQUESTS
    -------------------------------------------------- */

    initListeners() {

      if (window.InvincibleTelemetry) {

        window.InvincibleTelemetry.on(
          '2_MIN_FIX_REQUESTED',
          payload => this.initiateTwoMinuteFix(payload)
        );

      }


      window.addEventListener(
        'invincible:event',
        event => {

          if (
            event.detail &&
            event.detail.type === '2_MIN_FIX_REQUESTED'
          ) {

            this.initiateTwoMinuteFix(
              event.detail.payload
            );

          }

        }
      );
    }


    /* --------------------------------------------------
       START 2-MINUTE FIX
    -------------------------------------------------- */

    async initiateTwoMinuteFix(payload) {

      console.log(
        '[AI Orchestrator] 2-Minute Fix:',
        payload
      );


      this.currentFixState = payload || {};


      const container =
        document.getElementById('aiCoachContainer');


      if (!container) {

        console.warn(
          "Missing #aiCoachContainer"
        );

        return;
      }


      /*
         IMPORTANT:
         The container is normally hidden in app.html.
         Make it visible before rendering the fix.
      */

      container.style.display = 'flex';


      container.innerHTML = `

        <div class="invincible-fix-panel">

          <div class="invincible-fix-loading">

            <div class="invincible-fix-icon">
              ⏱️
            </div>

            <h3>
              2-Minute Fix
            </h3>

            <p>
              Repairing:
              ${this.escapeHTML(payload?.topic || 'this concept')}
            </p>

            <div class="invincible-fix-spinner"></div>

          </div>

        </div>

      `;


      try {

        const fixData =
          await this.fetchFixFromAI(payload);


        this.renderFixUI(
          container,
          fixData
        );


      } catch (error) {

        console.error(
          '[AI Orchestrator] Generation failed:',
          error
        );


        container.innerHTML = `

          <div class="invincible-fix-panel">

            <div class="invincible-fix-error">

              <h3>
                Fix could not be generated
              </h3>

              <p>
                Please try again in a moment.
              </p>

              <button
                type="button"
                onclick="window.InvincibleAI.closeFix()"
              >
                CLOSE
              </button>

            </div>

          </div>

        `;

      }
    }


    /* --------------------------------------------------
       SECURE AI REQUEST
    -------------------------------------------------- */

    async fetchFixFromAI(payload) {

      const response =
        await fetch('/api/generate-fix', {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({

            subject:
              payload?.subject || 'General',

            topic:
              payload?.topic || 'General',

            originalQuestion:
              payload?.originalQuestion || '',

            coreMisconception:
              payload?.coreMisconception || ''

          })

        });


      if (!response.ok) {

        throw new Error(
          `API returned status: ${response.status}`
        );

      }


      return await response.json();
    }


    /* --------------------------------------------------
       RENDER FIX
    -------------------------------------------------- */

    renderFixUI(container, fixData) {

      if (!fixData) {
        throw new Error('Empty fix response.');
      }


      if (!Array.isArray(fixData.options)) {
        throw new Error(
          'Invalid fix response: options missing.'
        );
      }


      this.currentFixState.correctIndex =
        Number(fixData.correctIndex);


      const subject =
        this.escapeHTML(
          this.currentFixState.subject ||
          'General'
        );


      const topic =
        this.escapeHTML(
          this.currentFixState.topic ||
          'Concept'
        );


      const explanation =
        this.escapeHTML(
          fixData.explanation || ''
        );


      const example =
        this.escapeHTML(
          fixData.example || ''
        );


      const question =
        this.escapeHTML(
          fixData.question || ''
        );


      const options =
        fixData.options
          .map((option, index) => `

            <button
              type="button"
              class="invincible-fix-option"
              onclick="window.InvincibleAI.handleFixAnswer(${index}, this)"
            >
              ${this.escapeHTML(option)}
            </button>

          `)
          .join('');


      container.innerHTML = `

        <div class="invincible-fix-panel">

          <div class="invincible-fix-header">

            <div>

              <span class="invincible-fix-label">
                2-MIN FIX
              </span>

              <h3>
                Repair this concept
              </h3>

            </div>

            <button
              type="button"
              class="invincible-fix-close"
              onclick="window.InvincibleAI.closeFix()"
              aria-label="Close"
            >
              ×
            </button>

          </div>


          <div class="invincible-fix-meta">
            ${subject} · ${topic}
          </div>


          <section class="invincible-fix-section">

            <h4>
              1. The Concept
            </h4>

            <div class="invincible-fix-content">
              ${explanation}
            </div>

          </section>


          <section class="invincible-fix-section">

            <h4>
              2. Worked Example
            </h4>

            <div class="invincible-fix-content">
              ${example}
            </div>

          </section>


          <section class="invincible-fix-section">

            <h4>
              3. Prove Your Mastery
            </h4>

            <p class="invincible-fix-question">
              ${question}
            </p>


            <div
              id="fixOptionsGrid"
              class="invincible-fix-options"
            >
              ${options}
            </div>

          </section>


          <div
            id="fixResultHUD"
            class="invincible-fix-result"
            style="display:none;"
          ></div>

        </div>

      `;
    }


    /* --------------------------------------------------
       CHECK STUDENT ANSWER
    -------------------------------------------------- */

    handleFixAnswer(
      selectedIndex,
      btnElement
    ) {

      if (!this.currentFixState) {
        return;
      }


      const correctIndex =
        Number(
          this.currentFixState.correctIndex
        );


      const isCorrect =
        Number(selectedIndex) === correctIndex;


      const grid =
        document.getElementById(
          'fixOptionsGrid'
        );


      if (!grid) {
        return;
      }


      const options =
        grid.querySelectorAll('button');


      options.forEach(
        (button, index) => {

          button.disabled = true;

          button.classList.add(
            'is-disabled'
          );


          if (index === correctIndex) {

            button.classList.add(
              'is-correct'
            );

          }

        }
      );


      if (btnElement) {

        btnElement.classList.add(
          isCorrect
            ? 'is-correct'
            : 'is-wrong'
        );

      }


      const hud =
        document.getElementById(
          'fixResultHUD'
        );


      if (!hud) {
        return;
      }


      hud.style.display = 'block';


      if (isCorrect) {

        if (
          typeof window.playDing ===
          'function'
        ) {
          window.playDing();
        }


        hud.innerHTML = `

          <div class="fix-success">

            <strong>
              Concept repaired.
            </strong>

            <span>
              You cleared the verification question.
            </span>

            <button
              type="button"
              onclick="window.InvincibleAI.closeFix()"
            >
              CONTINUE
            </button>

          </div>

        `;


        /*
           Broadcast completion to the central
           telemetry engine.
        */

        if (
          window.InvincibleTelemetry &&
          typeof window.InvincibleTelemetry.emit ===
          'function'
        ) {

          window.InvincibleTelemetry.emit(
            '2_MIN_FIX_COMPLETED',
            {
              subject:
                this.currentFixState.subject ||
                'General',

              topic:
                this.currentFixState.topic ||
                'General',

              mistakeId:
                this.currentFixState.mistakeId ||
                null
            }
          );

        }


        /*
           Resolve the canonical mistake when
           an actual mistake ID is available.
        */

        if (
          window.InvincibleVault &&
          this.currentFixState.mistakeId &&
          typeof window.InvincibleVault.markResolved ===
          'function'
        ) {

          try {

            window.InvincibleVault.markResolved(
              this.currentFixState.mistakeId
            );

          } catch (error) {

            console.warn(
              '[AI Orchestrator] Could not resolve vault item:',
              error
            );

          }

        }


      } else {

        if (
          typeof window.playBuzz ===
          'function'
        ) {
          window.playBuzz();
        }


        hud.innerHTML = `

          <div class="fix-still-unstable">

            <strong>
              Not fixed yet.
            </strong>

            <span>
              Keep this mistake in your learning loop
              and attempt the fix again later.
            </span>

            <button
              type="button"
              onclick="window.InvincibleAI.closeFix()"
            >
              BACK
            </button>

          </div>

        `;
      }
    }


    /* --------------------------------------------------
       CLOSE
    -------------------------------------------------- */

    closeFix() {

      const container =
        document.getElementById(
          'aiCoachContainer'
        );


      if (container) {

        container.innerHTML = '';

        /*
           Critical:
           hide the overlay again after closing.
        */

        container.style.display = 'none';

      }


      this.currentFixState = null;


      /*
         Return to the main student dashboard.
      */

      if (
        typeof window.switchTab ===
        'function'
      ) {

        window.switchTab('home');

      }
    }


    /* --------------------------------------------------
       BASIC HTML ESCAPING
       Prevents AI-generated text from becoming
       executable HTML.
    -------------------------------------------------- */

    escapeHTML(value) {

      const text =
        String(value ?? '');


      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    }

  }


  window.InvincibleAI =
    new AIOrchestrator();


})(window);