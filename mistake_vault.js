/* =====================================================
   ⚡ INVINCIBLE 360 - CANONICAL MISTAKE VAULT

   Learning loop:

   Mistake
      ↓
   Vault
      ↓
   Prioritize
      ↓
   2-Minute Fix
      ↓
   Verification
      ↓
   Mastery Recovery
      ↓
   Next Best Move

   This file is the ONE canonical local mistake store.
===================================================== */

(function(window) {
  'use strict';


  const STORAGE_KEY_MISTAKES =
    'invincible_mistake_vault';


  const LEGACY_STORAGE_KEY =
    'mistake_vault';


  class MistakeVaultEngine {

    constructor() {

      this.mistakes =
        this.loadVault();

      this.initListeners();

    }


    /* =================================================
       STORAGE
    ================================================= */

    loadVault() {

      let canonical = [];


      try {

        const saved =
          localStorage.getItem(
            STORAGE_KEY_MISTAKES
          );

        canonical =
          saved
            ? JSON.parse(saved)
            : [];

        if (!Array.isArray(canonical)) {
          canonical = [];
        }

      } catch (error) {

        canonical = [];

      }


      /*
         One-time migration from the old
         telemetry.js mistake database.

         We do NOT keep using the old database.
      */

      try {

        const legacyRaw =
          localStorage.getItem(
            LEGACY_STORAGE_KEY
          );


        if (legacyRaw) {

          const legacy =
            JSON.parse(legacyRaw);


          if (Array.isArray(legacy)) {

            legacy.forEach(item => {

              const normalized =
                this.normalizeMistake(item);


              if (!normalized) {
                return;
              }


              const duplicate =
                canonical.some(existing =>
                  this.sameMistake(
                    existing,
                    normalized
                  )
                );


              if (!duplicate) {

                canonical.push(
                  normalized
                );

              }

            });


            /*
               Keep the old data untouched for
               safety, but stop reading it after
               migration.
            */

            if (canonical.length > 50) {

              canonical =
                canonical.slice(0, 50);

            }


            try {

              localStorage.setItem(
                STORAGE_KEY_MISTAKES,
                JSON.stringify(canonical)
              );

            } catch (error) {}

          }

        }

      } catch (error) {

        console.warn(
          '[Mistake Vault] Legacy migration skipped.',
          error
        );

      }


      return canonical;

    }


    saveVault() {

      try {

        localStorage.setItem(
          STORAGE_KEY_MISTAKES,
          JSON.stringify(
            this.mistakes
          )
        );

      } catch (error) {

        console.warn(
          '[Mistake Vault] Could not save vault.',
          error
        );

      }

    }


    normalizeMistake(item) {

      if (
        !item ||
        typeof item !== 'object'
      ) {

        return null;

      }


      const question =
        this.safeString(
          item.question ||
          item.questionText ||
          item.question_text,
          ''
        );


      if (!question) {
        return null;
      }


      return {

        id:
          item.id ||
          (
            'mstk_' +
            Date.now() +
            '_' +
            Math.random()
              .toString(36)
              .slice(2, 7)
          ),


        subject:
          this.safeString(
            item.subject,
            'General'
          ),


        topic:
          this.safeString(
            item.topic ||
            item.chapter,
            'General'
          ),


        question,


        yourAnswer:
          this.safeString(
            item.yourAnswer ||
            item.studentAnswer ||
            item.student_answer,
            'Not recorded'
          ),


        correctAnswer:
          this.safeString(
            item.correctAnswer ||
            item.correct_answer,
            'Not recorded'
          ),


        category:
          this.safeString(
            item.category,
            'Concept Confusion'
          ),


        explanation:
          this.safeString(
            item.explanation,
            'Review the underlying concept.'
          ),


        timestamp:
          item.timestamp ||
          Date.now(),


        attempts:
          Math.max(
            1,
            Number(item.attempts) || 1
          ),


        resolved:
          Boolean(
            item.resolved ||
            item.remediated
          )

      };

    }


    sameMistake(a, b) {

      if (!a || !b) {
        return false;
      }


      return (
        String(a.question || '').trim() ===
        String(b.question || '').trim()
      );

    }


    safeString(value, fallback = '') {

      const result =
        String(
          value ?? ''
        ).trim();


      return result || fallback;

    }


    escapeHTML(value) {

      return String(
        value ?? ''
      )
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    }


    /* =================================================
       EVENT CONNECTION
    ================================================= */

    initListeners() {

      /*
         IMPORTANT:

         Subscribe ONLY to InvincibleTelemetry.on().

         InvincibleTelemetry.emit() already calls the
         browser 'invincible:event' event, so listening
         to both would process the same mistake twice.
      */

      if (
        window.InvincibleTelemetry &&
        typeof window.InvincibleTelemetry.on ===
        'function'
      ) {

        window.InvincibleTelemetry.on(
          'MISTAKE_LOGGED',
          payload => {

            this.recordMistake(
              payload
            );

          }
        );

      }

    }


    /* =================================================
       RECORD MISTAKE
    ================================================= */

    recordMistake(payload = {}) {

      const normalized =
        this.normalizeMistake(
          payload
        );


      if (!normalized) {
        return null;
      }


      /*
         If the same unresolved question is encountered
         again, increase its attempt count instead of
         creating another duplicate card.
      */

      const existingIndex =
        this.mistakes.findIndex(
          item =>
            !item.resolved &&
            this.sameMistake(
              item,
              normalized
            )
        );


      if (existingIndex !== -1) {

        const existing =
          this.mistakes[
            existingIndex
          ];


        existing.attempts =
          (
            Number(existing.attempts) || 1
          ) + 1;


        existing.timestamp =
          Date.now();


        /*
           Update contextual information when
           a later attempt has better data.
        */

        if (
          normalized.yourAnswer &&
          normalized.yourAnswer !==
            'Not recorded'
        ) {

          existing.yourAnswer =
            normalized.yourAnswer;

        }


        if (
          normalized.correctAnswer &&
          normalized.correctAnswer !==
            'Not recorded'
        ) {

          existing.correctAnswer =
            normalized.correctAnswer;

        }


        if (normalized.explanation) {

          existing.explanation =
            normalized.explanation;

        }


        this.saveVault();

        this.refreshUI();

        return existing;

      }


      this.mistakes.unshift(
        normalized
      );


      /*
         Keep the vault focused on recent,
         actionable mistakes.
      */

      if (this.mistakes.length > 50) {

        this.mistakes =
          this.mistakes.slice(0, 50);

      }


      this.saveVault();

      this.refreshUI();


      return normalized;

    }


    /* =================================================
       READ
    ================================================= */

    getActiveMistakes() {

      return this.mistakes.filter(
        item =>
          item &&
          !item.resolved
      );

    }


    getResolvedMistakes() {

      return this.mistakes.filter(
        item =>
          item &&
          item.resolved
      );

    }


    getMistakeById(id) {

      return this.mistakes.find(
        item =>
          item.id === id
      ) || null;

    }


    /* =================================================
       PRIORITY ENGINE
    ================================================= */

    getPriorityMistake() {

      const active =
        this.getActiveMistakes();


      if (!active.length) {
        return null;
      }


      /*
         Priority is based on:

         1. Repeated failures
         2. Recency
      */

      return [...active].sort(
        (a, b) => {

          const attemptDifference =
            (
              Number(b.attempts) || 1
            ) -
            (
              Number(a.attempts) || 1
            );


          if (attemptDifference !== 0) {

            return attemptDifference;

          }


          return (
            Number(b.timestamp) || 0
          ) -
          (
            Number(a.timestamp) || 0
          );

        }
      )[0];

    }


    /* =================================================
       OPEN VAULT
    ================================================= */

    openVaultModal() {

      const existing =
        document.getElementById(
          'mistakeVaultModal'
        );


      if (existing) {
        existing.remove();
      }


      const active =
        this.getActiveMistakes();


      const itemsHTML =
        active.length === 0

          ? `

            <div
              style="
                text-align:center;
                padding:34px 18px;
              "
            >

              <div
                style="
                  font-size:36px;
                  margin-bottom:10px;
                "
              >
                ✓
              </div>

              <div
                style="
                  font-weight:900;
                  color:#fff;
                  font-size:17px;
                "
              >
                Vault is clear
              </div>

              <div
                style="
                  color:#94a3b8;
                  font-size:12px;
                  line-height:1.5;
                  margin-top:6px;
                "
              >
                No unresolved concept mistakes
                need your attention right now.
              </div>

            </div>

          `

          : active
              .map(
                (mistake, index) => `

                  <div
                    style="
                      background:rgba(255,255,255,0.025);
                      border:1px solid rgba(244,63,94,0.20);
                      border-radius:12px;
                      padding:13px;
                      margin-bottom:9px;
                    "
                  >

                    <div
                      style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:8px;
                        margin-bottom:7px;
                      "
                    >

                      <span
                        style="
                          font-size:10px;
                          font-weight:900;
                          color:#f43f5e;
                          background:rgba(244,63,94,0.10);
                          padding:3px 7px;
                          border-radius:6px;
                        "
                      >
                        ${this.escapeHTML(
                          mistake.category
                        )}
                      </span>


                      <span
                        style="
                          font-size:10px;
                          color:#64748b;
                          font-weight:700;
                        "
                      >
                        ${this.escapeHTML(
                          mistake.subject
                        )}
                        ·
                        ${this.escapeHTML(
                          mistake.topic
                        )}
                      </span>

                    </div>


                    <div
                      style="
                        font-size:13px;
                        font-weight:800;
                        color:#fff;
                        line-height:1.45;
                        margin-bottom:8px;
                      "
                    >
                      ${this.escapeHTML(
                        mistake.question
                      )}
                    </div>


                    <div
                      style="
                        font-size:10px;
                        color:#94a3b8;
                        margin-bottom:9px;
                      "
                    >
                      ${mistake.attempts || 1}
                      recorded
                      ${
                        (mistake.attempts || 1) === 1
                          ? 'attempt'
                          : 'attempts'
                      }
                    </div>


                    <button
                      type="button"
                      onclick="
                        window.InvincibleVault
                          .startFixForMistake('${this.escapeHTML(mistake.id)}')
                      "
                      style="
                        width:100%;
                        padding:10px 12px;
                        border:none;
                        border-radius:9px;
                        background:#00e5ff;
                        color:#020617;
                        font-weight:900;
                        font-size:11px;
                        cursor:pointer;
                      "
                    >
                      FIX THIS CONCEPT
                    </button>

                  </div>

                `
              )
              .join('');


      const modalHTML = `

        <div
          id="mistakeVaultModal"
          class="bottom-sheet-overlay open"
          onclick="
            window.InvincibleVault.closeVaultModal()
          "
          style="z-index:100010;"
        >

          <div
            class="bottom-sheet-content"
            onclick="event.stopPropagation()"
            style="
              max-height:85vh;
              overflow-y:auto;
            "
          >

            <div class="sheet-handle"></div>


            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
                margin-bottom:16px;
              "
            >

              <div>

                <h3
                  style="
                    font-size:20px;
                    font-weight:900;
                    color:#fff;
                    margin:0;
                  "
                >
                  Mistake Vault
                </h3>

                <div
                  style="
                    font-size:11px;
                    color:#94a3b8;
                    font-weight:700;
                    margin-top:3px;
                  "
                >
                  ${active.length}
                  concept${
                    active.length === 1
                      ? ''
                      : 's'
                  }
                  to recover
                </div>

              </div>


              ${
                active.length > 0
                  ? `

                    <button
                      type="button"
                      onclick="
                        window.InvincibleVault
                          .startBattleMyMistakes()
                      "
                      style="
                        background:rgba(244,63,94,0.12);
                        color:#f43f5e;
                        border:1px solid rgba(244,63,94,0.30);
                        padding:8px 11px;
                        border-radius:9px;
                        font-weight:900;
                        font-size:10px;
                        cursor:pointer;
                      "
                    >
                      FIX PRIORITY
                    </button>

                  `
                  : ''
              }

            </div>


            <div>
              ${itemsHTML}
            </div>


            <button
              type="button"
              class="solid-cta"
              onclick="
                window.InvincibleVault
                  .closeVaultModal()
              "
              style="
                margin-top:10px;
                background:rgba(255,255,255,0.06) !important;
                color:#fff !important;
              "
            >
              CLOSE
            </button>

          </div>

        </div>

      `;


      document.body.insertAdjacentHTML(
        'beforeend',
        modalHTML
      );


      if (
        typeof window.playDing ===
        'function'
      ) {

        window.playDing();

      }

    }


    /* =================================================
       CLOSE VAULT
    ================================================= */

    closeVaultModal() {

      const modal =
        document.getElementById(
          'mistakeVaultModal'
        );


      if (modal) {
        modal.remove();
      }

    }


    /* =================================================
       START FIX FOR ONE MISTAKE
    ================================================= */

    startFixForMistake(mistakeId) {

      const mistake =
        this.getMistakeById(
          mistakeId
        );


      if (!mistake) {
        return;
      }


      this.closeVaultModal();


      this.emitFixRequest(
        mistake
      );

    }


    /* =================================================
       FIX PRIORITY MISTAKE
    ================================================= */

    startBattleMyMistakes() {

      const priority =
        this.getPriorityMistake();


      if (!priority) {

        this.closeVaultModal();

        return;

      }


      this.closeVaultModal();


      this.emitFixRequest(
        priority
      );

    }


    /* =================================================
       EMIT 2-MINUTE FIX
    ================================================= */

    emitFixRequest(mistake) {

      const fixPayload = {

        subject:
          mistake.subject ||
          'General',


        topic:
          mistake.topic ||
          'General',


        originalQuestion:
          mistake.question ||
          '',


        coreMisconception:
          mistake.explanation ||
          '',


        mistakeId:
          mistake.id ||
          null

      };


      /*
         ONE canonical event.

         aiOrchestrator.js listens to this event
         and opens the actual 2-Minute Fix UI.
      */

      if (
        window.InvincibleTelemetry &&
        typeof window.InvincibleTelemetry.emit ===
        'function'
      ) {

        window.InvincibleTelemetry.emit(
          '2_MIN_FIX_REQUESTED',
          fixPayload
        );


        return;

      }


      console.warn(
        '[Mistake Vault] InvincibleTelemetry unavailable.'
      );

    }


    /* =================================================
       RESOLVE MISTAKE
    ================================================= */

    markResolved(mistakeId) {

      const item =
        this.getMistakeById(
          mistakeId
        );


      if (!item || item.resolved) {
        return;
      }


      item.resolved =
        true;


      item.resolvedAt =
        Date.now();


      this.saveVault();


      /*
         Central learning event.

         engine_telemetry.js receives this and
         updates mastery.
      */

      if (
        window.InvincibleTelemetry &&
        typeof window.InvincibleTelemetry.emit ===
        'function'
      ) {

        window.InvincibleTelemetry.emit(
          'MISTAKE_RECOVERED',
          {

            subject:
              item.subject,

            topic:
              item.topic,

            mistakeId:
              item.id,

            fixedCount:
              1

          }
        );

      }


      /*
         Reward recovery.

         This remains deliberately modest:
         the learning outcome is more important
         than the XP reward.
      */

      if (
        typeof window.addStudentXP ===
        'function'
      ) {

        try {

          window.addStudentXP(30);

        } catch (error) {}

      }


      this.refreshUI();

    }


    /* =================================================
       UI REFRESH
    ================================================= */

    refreshUI() {

      /*
         Update compatibility badge.
      */

      const badge =
        document.getElementById(
          'vaultBadge'
        );


      if (badge) {

        const count =
          this.getActiveMistakes()
            .length;


        badge.textContent =
          count > 0
            ? count
            : '';


        badge.style.display =
          count > 0
            ? 'inline-block'
            : 'none';

      }


      /*
         Update Learning Intelligence
         through the compatibility layer.
      */

      if (
        window.TelemetryEngine &&
        typeof window.TelemetryEngine
          .renderLearningIntelligence ===
          'function'
      ) {

        try {

          window.TelemetryEngine
            .renderLearningIntelligence();

        } catch (error) {}

      }

    }

  }


  /* ===================================================
     GLOBAL CANONICAL INSTANCE
  =================================================== */

  window.InvincibleVault =
    new MistakeVaultEngine();


})(window);