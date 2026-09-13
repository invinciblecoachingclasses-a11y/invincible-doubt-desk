/* =====================================================
   INVINCIBLE 360 — AI PRACTICE EVIDENCE BRIDGE
   Records learning evidence without changing mastery.
===================================================== */

(function () {
  'use strict';

  function emit(eventName, payload) {
    if (
      !window.InvincibleTelemetry ||
      typeof window.InvincibleTelemetry.emit !== 'function'
    ) {
      return;
    }

    window.InvincibleTelemetry.emit(
      eventName,
      Object.assign(
        {
          source: 'arena_ai_practice'
        },
        payload || {}
      )
    );
  }

  function currentQuestion() {
    if (
      !window.arena ||
      !Array.isArray(window.arena.questions)
    ) {
      return null;
    }

    return window.arena.questions[window.arena.currentQ] || null;
  }

  function questionPayload(extra) {
    const q = currentQuestion() || {};

    const subjectEl =
      document.getElementById('arenaSubject');

    const chapterEl =
      document.getElementById('arenaChapter');

    return Object.assign(
      {
        subject:
          subjectEl?.value ||
          q.subject ||
          'General',

        chapter:
          chapterEl?.value ||
          q.chapter ||
          'AI Practice',

        topic:
          q.topic ||
          q.topic_name ||
          '',

        concept:
          q.concept ||
          q.concept_name ||
          '',

        question:
          q.question_text ||
          q.question ||
          '',

        questionNumber:
          (window.arena?.currentQ || 0) + 1,

        isCorrect: false
      },
      extra || {}
    );
  }

  function install() {

    /* ---------------------------------------------
       1. AI PRACTICE STARTED
    --------------------------------------------- */

    if (
      typeof window.startBotMatch === 'function' &&
      !window.startBotMatch.__evidenceWrapped
    ) {
      const originalStart =
        window.startBotMatch;

      function wrappedStartBotMatch() {

        const result =
          originalStart.apply(this, arguments);

        emit('PRACTICE_STARTED', {
          subject:
            document.getElementById('arenaSubject')
              ?.value || 'General',

          chapter:
            document.getElementById('arenaChapter')
              ?.value || 'AI Practice',

          practiceType:
            'AI_BOT',

          questionCount:
            window.arena?.questions?.length || 0
        });

        return result;
      }

      wrappedStartBotMatch.__evidenceWrapped = true;
      wrappedStartBotMatch.__original =
        originalStart;

      window.startBotMatch =
        wrappedStartBotMatch;
    }


    /* ---------------------------------------------
       2. EACH AI PRACTICE ANSWER
    --------------------------------------------- */

    if (
      typeof window.handleArenaAnswer === 'function' &&
      !window.handleArenaAnswer.__evidenceWrapped
    ) {
      const originalAnswer =
        window.handleArenaAnswer;

      async function wrappedHandleArenaAnswer(
        element,
        selectedIdx,
        correctIdx
      ) {

        const isBotPractice =
          !!window.arena?.isBotMatch;

        if (
          isBotPractice &&
          window.arena?.questions?.[
            window.arena.currentQ
          ]
        ) {

          const isCorrect =
            Number(selectedIdx) ===
            Number(correctIdx);

          emit(
            isCorrect
              ? 'QUESTION_SOLVED'
              : 'QUESTION_WRONG',

            questionPayload({
              selectedAnswer:
                Number.isFinite(
                  Number(selectedIdx)
                ) &&
                Number(selectedIdx) >= 0
                  ? Number(selectedIdx)
                  : null,

              correctAnswer:
                Number(correctIdx),

              isCorrect:
                isCorrect,

              result:
                isCorrect
                  ? 'correct'
                  : 'wrong',

              timedOut:
                Number(selectedIdx) === -1
            })
          );
        }

        return originalAnswer.apply(
          this,
          arguments
        );
      }

      wrappedHandleArenaAnswer.__evidenceWrapped =
        true;

      wrappedHandleArenaAnswer.__original =
        originalAnswer;

      window.handleArenaAnswer =
        wrappedHandleArenaAnswer;
    }


    /* ---------------------------------------------
       3. AI PRACTICE COMPLETED
    --------------------------------------------- */

    if (
      typeof window.finishArenaGame === 'function' &&
      !window.finishArenaGame.__evidenceWrapped
    ) {
      const originalFinish =
        window.finishArenaGame;

      function wrappedFinishArenaGame() {

        if (window.arena?.isBotMatch) {

          emit('PRACTICE_COMPLETED', {

            subject:
              document.getElementById(
                'arenaSubject'
              )?.value || 'General',

            chapter:
              document.getElementById(
                'arenaChapter'
              )?.value || 'AI Practice',

            practiceType:
              'AI_BOT',

            score:
              Number(
                window.arena?.score
              ) || 0,

            totalQuestions:
              window.arena?.questions?.length ||
              0,

            highestStreak:
              Number(
                window.arena?.highestStreak
              ) || 0,

            result:
              'completed'
          });
        }

        return originalFinish.apply(
          this,
          arguments
        );
      }

      wrappedFinishArenaGame.__evidenceWrapped =
        true;

      wrappedFinishArenaGame.__original =
        originalFinish;

      window.finishArenaGame =
        wrappedFinishArenaGame;
    }
  }

  install();

  setTimeout(
    install,
    0
  );

})();