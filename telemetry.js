/* =====================================================
   INVINCIBLE 360 - LEGACY TELEMETRY COMPATIBILITY BRIDGE

   IMPORTANT ARCHITECTURE:
   Old modules may still call window.TelemetryEngine.

   They are now routed into the canonical systems:

       TelemetryEngine
              ↓
       InvincibleTelemetry
              ↓
       Learning Events
              ↓
       InvincibleVault
              ↓
       Next Best Move / Mastery

   This file must NOT maintain a second mistake database.
===================================================== */

(function(window) {
  'use strict';


  /* ===================================================
     INTERNAL HELPERS
  =================================================== */

  function safeString(value, fallback = '') {
    const result = String(value ?? '').trim();
    return result || fallback;
  }


  function getCanonicalVault() {

    if (
      window.InvincibleVault &&
      Array.isArray(window.InvincibleVault.mistakes)
    ) {
      return window.InvincibleVault.mistakes;
    }

    return [];
  }


  function getStudentProfile() {

    try {

      return JSON.parse(
        localStorage.getItem('student_profile') || '{}'
      );

    } catch (error) {

      return {};

    }
  }


  /* ===================================================
     LEARNING INTELLIGENCE
  =================================================== */

  window.MistakeAnalytics = {

    compute() {

      const vault =
        getCanonicalVault();


      const cleanVault =
        vault
          .filter(item =>
            item &&
            typeof item === 'object'
          )
          .map(item => ({

            id:
              item.id || null,

            subject:
              safeString(
                item.subject,
                'General'
              ),

            chapter:
              safeString(
                item.topic ||
                item.chapter,
                'Foundational Topics'
              ),

            questionText:
              safeString(
                item.question ||
                item.questionText ||
                item.question_text,
                'Assessment Question'
              ),

            studentAnswer:
              safeString(
                item.yourAnswer ||
                item.studentAnswer ||
                item.student_answer
              ),

            correctAnswer:
              safeString(
                item.correctAnswer ||
                item.correct_answer
              ),

            remediated:
              Boolean(
                item.resolved ||
                item.remediated
              ),

            timestamp:
              item.timestamp ||
              Date.now()

          }));


      const totalMistakes =
        cleanVault.length;


      const pendingMistakes =
        cleanVault.filter(
          item => !item.remediated
        );


      const resolvedMistakes =
        cleanVault.filter(
          item => item.remediated
        );


      /* -----------------------------------------------
         SUBJECT BREAKDOWN
      ------------------------------------------------ */

      const subjectCounts = {};


      cleanVault.forEach(item => {

        subjectCounts[item.subject] =
          (subjectCounts[item.subject] || 0) + 1;

      });


      /* -----------------------------------------------
         CHAPTER / TOPIC BREAKDOWN
      ------------------------------------------------ */

      const chapterCounts = {};

      const chapterSubjectMap = {};


      pendingMistakes.forEach(item => {

        chapterCounts[item.chapter] =
          (chapterCounts[item.chapter] || 0) + 1;


        if (!chapterSubjectMap[item.chapter]) {

          chapterSubjectMap[item.chapter] =
            item.subject;

        }

      });


      const sortedChapters =

        Object.entries(chapterCounts)

          .map(([chapter, count]) => ({

            chapter,

            subject:
              chapterSubjectMap[chapter] ||
              'General',

            count

          }))

          .sort(
            (a, b) => b.count - a.count
          );


      const top3WeakTopics =
        sortedChapters.slice(0, 3);


      const primaryFocusTopic =
        top3WeakTopics[0] || null;


      const strongerChapters =
        sortedChapters
          .filter(item => item.count <= 1)
          .slice(0, 3);


      /* -----------------------------------------------
         LEARNING STATUS
      ------------------------------------------------ */

      let learningStatus = {

        label:
          'All Clear',

        color:
          '#10b981',

        badge:
          '🟢 Optimal'

      };


      let reviseRecommendation =
        'You currently have no unresolved mistakes. Keep building mastery through practice.';


      if (pendingMistakes.length > 8) {

        learningStatus = {

          label:
            'Critical Revision Priority',

          color:
            '#ff4757',

          badge:
            '🔴 High Priority'

        };


        if (primaryFocusTopic) {

          reviseRecommendation =
            `Focus on ${primaryFocusTopic.chapter}. You have ${pendingMistakes.length} unresolved mistakes.`;

        }

      }

      else if (pendingMistakes.length > 3) {

        learningStatus = {

          label:
            'Active Attention Needed',

          color:
            '#f59e0b',

          badge:
            '🟠 Focus Required'

        };


        if (primaryFocusTopic) {

          reviseRecommendation =
            `Prioritize ${primaryFocusTopic.chapter}. A 2-Minute Fix can target the underlying misconception.`;

        }

      }

      else if (pendingMistakes.length > 0) {

        learningStatus = {

          label:
            'Minor Review',

          color:
            '#00e5ff',

          badge:
            '🟡 Stable'

        };


        if (primaryFocusTopic) {

          reviseRecommendation =
            `Review ${primaryFocusTopic.chapter} to eliminate your remaining ${pendingMistakes.length} mistake(s).`;

        }

      }


      return {

        totalMistakes,

        activeMistakes:
          pendingMistakes.length,

        resolvedCount:
          resolvedMistakes.length,

        subjectCounts,

        top3WeakTopics,

        primaryFocusTopic,

        strongerChapters,

        learningStatus,

        reviseRecommendation

      };

    }

  };


  /* ===================================================
     COMPATIBILITY API

     Existing modules can continue using
     window.TelemetryEngine without creating
     a second telemetry engine.
  =================================================== */

  const CompatibilityTelemetry = {


    /* -----------------------------------------------
       RECORD MISTAKE
    ------------------------------------------------ */

    async recordMistake(payload = {}) {

      const studentProfile =
        getStudentProfile();


      const normalizedPayload = {

        subject:
          safeString(
            payload.subject,
            'General'
          ),

        topic:
          safeString(
            payload.topic ||
            payload.chapter,
            'General'
          ),

        question:
          safeString(
            payload.question ||
            payload.questionText,
            ''
          ),

        yourAnswer:
          safeString(
            payload.yourAnswer ||
            payload.studentAnswer,
            ''
          ),

        correctAnswer:
          safeString(
            payload.correctAnswer,
            ''
          ),

        category:
          safeString(
            payload.category,
            'Concept Confusion'
          ),

        explanation:
          safeString(
            payload.explanation,
            ''
          ),

        studentId:
          studentProfile.id ||
          null

      };


      /*
         PRIMARY PATH:
         send the mistake through the central
         event bus.
      */

      if (
        window.InvincibleTelemetry &&
        typeof window.InvincibleTelemetry.emit ===
        'function'
      ) {

        window.InvincibleTelemetry.emit(
          'MISTAKE_LOGGED',
          normalizedPayload
        );

      }

      /*
         The canonical Mistake Vault listens to
         MISTAKE_LOGGED and records the mistake.

         No second localStorage database is created here.
      */


      this.updateVaultBadge();

      this.renderLearningIntelligence();

    },


    /* -----------------------------------------------
       VAULT BADGE
    ------------------------------------------------ */

    updateVaultBadge() {

      const badge =
        document.getElementById(
          'vaultBadge'
        );


      if (!badge) {
        return;
      }


      const activeMistakes =
        getCanonicalVault()
          .filter(
            item =>
              item &&
              !item.resolved &&
              !item.remediated
          );


      badge.textContent =
        activeMistakes.length > 0
          ? activeMistakes.length
          : '';


      badge.style.display =
        activeMistakes.length > 0
          ? 'inline-block'
          : 'none';

    },


    /* -----------------------------------------------
       OPEN CANONICAL VAULT
    ------------------------------------------------ */

    openMistakeVault() {

      if (
        window.InvincibleVault &&
        typeof window.InvincibleVault.openVaultModal ===
        'function'
      ) {

        window.InvincibleVault.openVaultModal();

        return;

      }


      console.warn(
        '[Telemetry Bridge] Canonical Mistake Vault is unavailable.'
      );

    },


    /* -----------------------------------------------
       LAUNCH FIX DRILL

       This is retained for older modules.

       It now routes into the same canonical
       2-Minute Fix event used everywhere else.
    ------------------------------------------------ */

    launchFixDrill(index) {

      const activeMistakes =
        getCanonicalVault()
          .filter(
            item =>
              item &&
              !item.resolved &&
              !item.remediated
          );


      const mistake =
        activeMistakes[index];


      if (!mistake) {
        return;
      }


      const payload = {

        subject:
          safeString(
            mistake.subject,
            'General'
          ),

        topic:
          safeString(
            mistake.topic ||
            mistake.chapter,
            'General'
          ),

        originalQuestion:
          safeString(
            mistake.question ||
            mistake.questionText ||
            mistake.question_text,
            ''
          ),

        coreMisconception:
          safeString(
            mistake.explanation,
            ''
          ),

        mistakeId:
          mistake.id || null

      };


      /*
         Close any legacy vault modal first.
      */

      const legacyModal =
        document.getElementById(
          'vaultModal'
        );


      if (legacyModal) {
        legacyModal.remove();
      }


      /*
         Send through canonical event bus.
      */

      if (
        window.InvincibleTelemetry &&
        typeof window.InvincibleTelemetry.emit ===
        'function'
      ) {

        window.InvincibleTelemetry.emit(
          '2_MIN_FIX_REQUESTED',
          payload
        );

      }

    },


    /* -----------------------------------------------
       LEARNING INTELLIGENCE RENDERER
    ------------------------------------------------ */

    renderLearningIntelligence() {

      const container =
        document.getElementById(
          'learningIntelligenceSection'
        );


      if (!container) {
        return;
      }


      const data =
        window.MistakeAnalytics.compute();


      let weakListHTML = '';


      if (
        data.top3WeakTopics.length === 0
      ) {

        weakListHTML = `

          <div
            style="
              font-size:12px;
              color:#10b981;
              font-weight:700;
            "
          >
            No recurring weak topics detected.
          </div>

        `;

      }

      else {

        weakListHTML =
          data.top3WeakTopics
            .map((topic, index) => `

              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  gap:10px;
                  padding:9px 10px;
                  margin-bottom:6px;
                  border-radius:10px;
                  background:#020617;
                  border:1px solid rgba(255,255,255,0.06);
                "
              >

                <div
                  style="
                    min-width:0;
                    overflow:hidden;
                    text-overflow:ellipsis;
                  "
                >

                  <span
                    style="
                      color:#00e5ff;
                      font-weight:900;
                      margin-right:6px;
                    "
                  >
                    ${index + 1}.
                  </span>

                  <span
                    style="
                      color:#e2e8f0;
                      font-size:12px;
                      font-weight:700;
                    "
                  >
                    ${topic.chapter}
                  </span>

                  <span
                    style="
                      color:#64748b;
                      font-size:10px;
                      margin-left:4px;
                    "
                  >
                    (${topic.subject})
                  </span>

                </div>


                <span
                  style="
                    flex-shrink:0;
                    color:#ff4757;
                    background:rgba(255,71,87,0.12);
                    padding:3px 7px;
                    border-radius:6px;
                    font-size:10px;
                    font-weight:800;
                  "
                >
                  ${topic.count}
                </span>

              </div>

            `)
            .join('');

      }


      const subjectEntries =
        Object.entries(
          data.subjectCounts
        );


      const subjectHTML =
        subjectEntries.length === 0

          ? `

            <span
              style="
                font-size:12px;
                color:#64748b;
              "
            >
              No subject data yet.
            </span>

          `

          : subjectEntries
              .map(
                ([subject, count]) => `

                  <span
                    style="
                      display:inline-block;
                      margin:3px 5px 3px 0;
                      padding:5px 9px;
                      border-radius:7px;
                      background:rgba(0,229,255,0.08);
                      border:1px solid rgba(0,229,255,0.15);
                      color:#cbd5e1;
                      font-size:11px;
                      font-weight:700;
                    "
                  >
                    ${subject}: ${count}
                  </span>

                `
              )
              .join('');


      container.innerHTML = `

        <div
          style="
            padding:16px;
          "
        >

          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              margin-bottom:14px;
            "
          >

            <div
              style="
                font-size:16px;
                font-weight:900;
                color:#fff;
              "
            >
              Learning Intelligence
            </div>


            <div
              style="
                font-size:10px;
                font-weight:800;
                color:${data.learningStatus.color};
              "
            >
              ${data.learningStatus.badge}
            </div>

          </div>


          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:8px;
              margin-bottom:14px;
            "
          >

            <div
              style="
                padding:12px;
                border-radius:10px;
                background:#020617;
              "
            >

              <div
                style="
                  color:#64748b;
                  font-size:10px;
                  font-weight:800;
                "
              >
                UNRESOLVED
              </div>

              <div
                style="
                  color:#ff4757;
                  font-size:22px;
                  font-weight:900;
                  margin-top:4px;
                "
              >
                ${data.activeMistakes}
              </div>

            </div>


            <div
              style="
                padding:12px;
                border-radius:10px;
                background:#020617;
              "
            >

              <div
                style="
                  color:#64748b;
                  font-size:10px;
                  font-weight:800;
                "
              >
                FIXED
              </div>

              <div
                style="
                  color:#10b981;
                  font-size:22px;
                  font-weight:900;
                  margin-top:4px;
                "
              >
                ${data.resolvedCount}
              </div>

            </div>

          </div>


          <div
            style="
              color:#94a3b8;
              font-size:11px;
              font-weight:800;
              margin-bottom:8px;
            "
          >
            RECURRING WEAK AREAS
          </div>


          ${weakListHTML}


          <div
            style="
              color:#94a3b8;
              font-size:11px;
              font-weight:800;
              margin:14px 0 8px;
            "
          >
            SUBJECT BREAKDOWN
          </div>


          <div>
            ${subjectHTML}
          </div>


          <div
            style="
              margin-top:14px;
              padding:11px;
              border-left:3px solid #00e5ff;
              border-radius:0 9px 9px 0;
              background:rgba(0,229,255,0.05);
              color:#cbd5e1;
              font-size:11px;
              line-height:1.5;
            "
          >

            <strong
              style="
                color:#00e5ff;
              "
            >
              NEXT:
            </strong>

            ${data.reviseRecommendation}

          </div>

        </div>

      `;

    }

  };


  /*
     Replace the old duplicate TelemetryEngine
     with the compatibility bridge.
  */

  window.TelemetryEngine =
    CompatibilityTelemetry;


  /*
     Initial UI synchronization.
  */

  function refreshTelemetryUI() {

    try {

      CompatibilityTelemetry.updateVaultBadge();

      CompatibilityTelemetry.renderLearningIntelligence();

    } catch (error) {

      console.warn(
        '[Telemetry Bridge] Initial UI refresh failed:',
        error
      );

    }

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      refreshTelemetryUI
    );

  }

  else {

    refreshTelemetryUI();

  }


  /*
     Keep dashboard intelligence synchronized
     when canonical learning events occur.
  */

  window.addEventListener(
    'invincible:event',
    event => {

      const eventType =
        event.detail?.type;


      if (
        eventType === 'MISTAKE_LOGGED' ||
        eventType === 'MISTAKE_RECOVERED' ||
        eventType === '2_MIN_FIX_COMPLETED' ||
        eventType === 'DOUBT_SOLVED' ||
        eventType === 'TEST_SUBMITTED' ||
        eventType === 'ARENA_FINISHED' ||
        eventType === 'LAB_COMPLETED'
      ) {

        setTimeout(
          refreshTelemetryUI,
          100
        );

      }

    }
  );


})(window);