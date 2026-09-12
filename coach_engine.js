/* =====================================================
   ⚡ INVINCIBLE 360 - AI LEARNING COACH
   - Lightweight pedagogical modes
   - Biology subject support
   - Clean responsibility: coaching + subject UI only
   - No dead visualizer code
===================================================== */

(function(window) {
  'use strict';

  let currentCoachMode = 'quick';

  const COACH_MODES = {
    quick: {
      name: 'Quick Answer',
      icon: '⚡',
      tagline: 'Gives the answer immediately, then explains only what is needed.',
      promptPrefix:
        'Give the student the direct answer immediately. Do NOT ask prerequisite questions or use Socratic questioning. Keep the explanation concise, clear and easy.'
    },

    hint: {
      name: 'Key Hint',
      icon: '💡',
      tagline: 'Gives the key idea or formula without the full solution.',
      promptPrefix:
        'Give only the key governing concept, formula, rule, or hint needed to solve the problem. Do not give the full solution unless the student asks for it. Do not ask prerequisite questions.'
    },

    exam: {
      name: 'Exam Fix',
      icon: '📝',
      tagline: 'Shows the cleanest board-exam method.',
      promptPrefix:
        'Give a clean CBSE board-exam-ready solution with the necessary steps, formula, units and relevant examiner trap. Do not unnecessarily delay the answer.'
    },

    deepdive: {
      name: 'Deep Dive',
      icon: '🔬',
      tagline: 'For complete conceptual understanding.',
      promptPrefix:
        'Give a deeper conceptual explanation with intuition, reasoning and derivation where useful. Teach progressively, but still state the main answer first.'
    }
  };


  function addSelectOption(selectId, value, label) {
    const select = document.getElementById(selectId);

    if (!select) return;

    if (select.querySelector(`option[value="${value}"]`)) {
      return;
    }

    const option = document.createElement('option');

    option.value = value;
    option.textContent = label;

    select.appendChild(option);
  }


  function addBiologyButton(parent, className, label, onClick) {
    if (!parent) return;

    if (parent.querySelector('[data-subject="Biology"]')) {
      return;
    }

    const button = document.createElement('button');

    button.type = 'button';
    button.className = className;
    button.dataset.subject = 'Biology';
    button.textContent = label;

    button.addEventListener('click', onClick);

    parent.appendChild(button);
  }


  class CoachEngine {

    constructor() {
      this.initCoachUI();
    }


    setMode(modeKey) {
      if (!COACH_MODES[modeKey]) {
        return;
      }

      currentCoachMode = modeKey;

      document.querySelectorAll('.coach-mode-pill').forEach(button => {
        button.classList.toggle(
          'active',
          button.dataset.mode === modeKey
        );
      });

      const description =
        document.getElementById('coachModeDescription');

      if (description) {
        description.textContent =
          COACH_MODES[modeKey].tagline;
      }

      if (typeof window.playDing === 'function') {
        window.playDing();
      }
    }


    getModePrompt() {
      let prompt =
        COACH_MODES[currentCoachMode]?.promptPrefix ||
        COACH_MODES.quick.promptPrefix;


      /*
         Biology-specific guidance.

         The API still remains responsible for the actual
         subject-specific answer. This only tells the AI
         how the selected Biology question should be handled.
      */

      if (window.invincibleSelectedSubject === 'Biology') {

        prompt += `

For Biology:
- Prefer NCERT terminology and standard CBSE Biology concepts.
- Clearly distinguish structure, function, process, sequence and cause-effect.
- For diagrams, identify relevant structures and labels accurately.
- Do not invent biological facts, examples, experiments or terminology.
- Keep the explanation appropriate to the student's class level when known.
- For Class 11-12 Biology, use precise biological terminology and appropriate depth.
`;
      }


      return prompt;
    }


    initCoachUI() {

      /*
         --------------------------------------------------
         AI COACHING MODE UI
         --------------------------------------------------
      */

      const mount =
        document.getElementById('coachModeSelectorMount');


      if (mount) {

        mount.innerHTML = `

          <div class="coach-mode-block">

            <div class="coach-mode-heading">

              <label>
                ANSWER STYLE
              </label>

              <span id="coachModeDescription">
                Instant answer with just enough explanation.
              </span>

            </div>


            <div class="coach-mode-grid">

              <button
                type="button"
                class="coach-mode-pill active"
                data-mode="quick"
                onclick="window.InvincibleCoach.setMode('quick')"
              >
                ⚡ Quick
              </button>


              <button
                type="button"
                class="coach-mode-pill"
                data-mode="hint"
                onclick="window.InvincibleCoach.setMode('hint')"
              >
                💡 Hint
              </button>


              <button
                type="button"
                class="coach-mode-pill"
                data-mode="exam"
                onclick="window.InvincibleCoach.setMode('exam')"
              >
                📝 Exam
              </button>


              <button
                type="button"
                class="coach-mode-pill"
                data-mode="deepdive"
                onclick="window.InvincibleCoach.setMode('deepdive')"
              >
                🔬 Deep Dive
              </button>

            </div>

          </div>
        `;
      }


      /*
         --------------------------------------------------
         DOUBT DESK — BIOLOGY
         --------------------------------------------------
      */

      const subjectControls =
        document.querySelectorAll(
          '#doubtSection .segmented-control'
        );


      const doubtSubjectControl =
        Array.from(subjectControls).find(control =>
          control.querySelector(
            '.subject[data-subject="Mathematics"]'
          )
        );


      addBiologyButton(
        doubtSubjectControl,
        'segmented-btn subject',
        'Biology',
        function() {

          window.invincibleSelectedSubject = 'Biology';


          /*
             doubt-notes.js owns selectedSubject.
             We update it only when that variable exists.
          */

          try {
            if (typeof selectedSubject !== 'undefined') {
              selectedSubject = 'Biology';
            }
          } catch (error) {
            // selectedSubject is not globally accessible here.
          }


          document
            .querySelectorAll('#doubtSection .subject')
            .forEach(button => {
              button.classList.remove('active');
            });


          this.classList.add('active');
        }
      );


      /*
         --------------------------------------------------
         TEST — BIOLOGY
         --------------------------------------------------
      */

      addSelectOption(
        'testSubject',
        'Biology',
        'Biology'
      );


      /*
         --------------------------------------------------
         ARENA — BIOLOGY
         --------------------------------------------------
      */

      addSelectOption(
        'arenaSubject',
        'Biology',
        'Biology'
      );


      /*
         --------------------------------------------------
         LAB — BIOLOGY
         --------------------------------------------------
      */

      const labControls =
        document.querySelectorAll(
          '#labSkillTree .segmented-control'
        );


      /*
         The second segmented control is the subject
         filter in the current Lab UI.
      */

      const labSubjectControl =
        labControls.length > 1
          ? labControls[1]
          : null;


      if (
        labSubjectControl &&
        !labSubjectControl.querySelector(
          '[data-subject="biology"]'
        )
      ) {

        const biologyLabButton =
          document.createElement('button');


        biologyLabButton.type = 'button';

        biologyLabButton.className =
          'segmented-btn lab-subj-btn';

        biologyLabButton.dataset.subject =
          'biology';

        biologyLabButton.textContent =
          'Biology';


        biologyLabButton.addEventListener(
          'click',
          function() {

            if (
              typeof window.filterLabSubject ===
              'function'
            ) {

              window.filterLabSubject(
                'biology',
                this
              );

            }

          }
        );


        labSubjectControl.appendChild(
          biologyLabButton
        );
      }


      /*
         --------------------------------------------------
         DEFAULT SUBJECT
         --------------------------------------------------
      */

      window.invincibleSelectedSubject =
        'Mathematics';
    }
  }


  /*
     ------------------------------------------------------
     CREATE GLOBAL COACH
     ------------------------------------------------------
  */

  window.InvincibleCoach =
    new CoachEngine();


})(window);