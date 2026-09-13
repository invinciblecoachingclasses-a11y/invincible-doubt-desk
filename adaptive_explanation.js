/* =====================================================
   INVINCIBLE 360 — ADAPTIVE EXPLANATION ENGINE
   Phase 2F

   Explains WHY the adaptive system selected the
   student's Next Best Move.

   Student-side only.
   Does not modify mastery.
   Does not modify engine_telemetry.js.
===================================================== */

(function (window) {
  'use strict';

  const NAME =
    'InvincibleAdaptiveExplanation';

  function number(value, fallback = 0) {
    const n = Number(value);

    return Number.isFinite(n)
      ? n
      : fallback;
  }

  function clean(value, fallback = '') {
    return (
      String(value ?? '').trim() ||
      fallback
    );
  }

  function getRecommendation() {
    if (
      !window.InvincibleAdaptiveRecommendation ||
      typeof
        window.InvincibleAdaptiveRecommendation
          .getRecommendation !== 'function'
    ) {
      return null;
    }

    try {
      return window.InvincibleAdaptiveRecommendation
        .getRecommendation();
    } catch (error) {
      console.warn(
        '[Adaptive Explanation] Could not get recommendation:',
        error
      );

      return null;
    }
  }

  function explain(
    suppliedRecommendation
  ) {

    const recommendation =
      suppliedRecommendation ||
      getRecommendation();

    if (!recommendation) {
      return {
        title:
          'Keep Learning',

        message:
          'Continue learning and practicing to build stronger evidence.',

        reason:
          'There is not enough learning data yet.'
      };
    }

    const action =
      clean(
        recommendation.action,
        'practice'
      ).toLowerCase();

    const mastery =
      number(
        recommendation.mastery,
        50
      );

    const evidence =
      number(
        recommendation.evidenceStrength,
        0
      );

    const topic =
      clean(
        recommendation.concept ||
        recommendation.topic,
        'this concept'
      );

    const unresolved =
      recommendation.hasUnresolvedMistake === true ||
      recommendation.unresolvedMistake === true ||
      number(
        recommendation.unresolvedMistakes,
        0
      ) > 0;

    switch (action) {

      case 'fix':

        return {
          title:
            'Fix This Concept',

          message:
            `You have an unresolved mistake in ${topic}. Fixing the misconception comes before more practice.`,

          reason:
            unresolved
              ? 'An unresolved mistake is blocking reliable mastery.'
              : 'Your recent learning evidence suggests that this concept needs repair.'
        };

      case 'understand':

        return {
          title:
            'Understand First',

          message:
            `Your current understanding of ${topic} is still weak. Let’s clarify the concept before asking you to practice it again.`,

          reason:
            `Current mastery is ${Math.round(mastery)}%.`
        };

      case 'practice':

        return {
          title:
            'Practice This Concept',

          message:
            `${topic} needs more successful practice before it can be considered secure.`,

          reason:
            `Current mastery is ${Math.round(mastery)}%, so additional practice is the highest-value next step.`
        };

      case 'verify':

        return {
          title:
            'Verify Your Understanding',

          message:
            `You appear to understand ${topic}, but there is not enough strong evidence yet. A verification question can confirm it.`,

          reason:
            `Mastery is ${Math.round(mastery)}%, but evidence strength is only ${Math.round(evidence)}.`
        };

      case 'refresh':

        return {
          title:
            'Refresh This Concept',

          message:
            `${topic} looks strong, but it has not been reinforced recently. A quick refresh can protect the learning.`,

          reason:
            `Your mastery is strong, but the concept is showing signs of aging.`
        };

      case 'maintain':

        return {
          title:
            'Maintain Your Mastery',

          message:
            `${topic} is currently in a healthy state. Keep using it normally and move on when appropriate.`,

          reason:
            `Mastery is ${Math.round(mastery)}% with sufficient learning evidence.`
        };

      default:

        return {
          title:
            'Continue Learning',

          message:
            `Continue working on ${topic}.`,

          reason:
            'The adaptive system has selected a general learning action.'
        };
    }
  }

  function getExplanation() {
    return explain();
  }

  window[NAME] = {

    explain,

    getExplanation,

    version:
      '2.0.0'
  };

  console.log(
    '[Invincible 360] Adaptive Explanation Engine loaded.'
  );

})(window);