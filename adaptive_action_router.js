/* =====================================================
   INVINCIBLE 360 — ADAPTIVE ACTION ROUTER
   Phase 2D

   Converts an adaptive recommendation into a real
   student-side action.

   IMPORTANT:
   - Student side only
   - Does NOT modify engine_telemetry.js
   - Does NOT create teacher/admin actions
   - Uses existing navigation wherever possible
   - Fails safely instead of inventing destinations
===================================================== */

(function (window, document) {
  'use strict';

  const NAME =
    'InvincibleAdaptiveActionRouter';

  function getRecommendation() {
    if (
      !window.InvincibleAdaptiveRecommendation ||
      typeof window.InvincibleAdaptiveRecommendation
        .getRecommendation !== 'function'
    ) {
      return null;
    }

    try {
      return window.InvincibleAdaptiveRecommendation
        .getRecommendation();
    } catch (error) {
      console.warn(
        '[Adaptive Router] Could not obtain recommendation:',
        error
      );

      return null;
    }
  }

  function callSwitchTab(tab) {
    if (
      typeof window.switchTab !== 'function'
    ) {
      console.warn(
        '[Adaptive Router] switchTab() is unavailable.'
      );

      return false;
    }

    try {
      window.switchTab(tab);
      return true;
    } catch (error) {
      console.warn(
        '[Adaptive Router] switchTab failed:',
        error
      );

      return false;
    }
  }

  function openDoubtDesk(recommendation) {

    const opened =
      callSwitchTab('doubt');

    if (!opened) {
      return false;
    }

    /*
      Pre-fill the existing Doubt Desk input when
      a useful concept is available.
    */

    const input =
      document.getElementById('question');

    if (
      input &&
      recommendation &&
      recommendation.concept &&
      recommendation.concept !== 'General'
    ) {

      const subject =
        recommendation.subject &&
        recommendation.subject !== 'General'
          ? recommendation.subject + ': '
          : '';

      input.value =
        subject +
        'Help me understand ' +
        recommendation.concept;
    }

    return true;
  }

  function openFix(recommendation) {

    /*
      The existing 2-Min Fix pathway is controlled
      by the AI Orchestrator / telemetry event flow.
    */

    if (
      window.InvincibleTelemetry &&
      typeof window.InvincibleTelemetry.emit ===
        'function'
    ) {

      window.InvincibleTelemetry.emit(
        '2_MIN_FIX_REQUESTED',
        {
          source:
            'adaptive_nbm',

          subject:
            recommendation?.subject ||
            'General',

          chapter:
            recommendation?.chapter ||
            '',

          topic:
            recommendation?.topic ||
            recommendation?.concept ||
            'General',

          concept:
            recommendation?.concept ||
            recommendation?.topic ||
            'General',

          reason:
            recommendation?.reason ||
            'Adaptive recommendation',

          mastery:
            recommendation?.mastery ??
            null,

          evidenceStrength:
            recommendation?.evidenceStrength ??
            null
        }
      );

      return true;
    }

    /*
      Fallback to the existing orchestrator if the
      telemetry event path is unavailable.
    */

    if (
      window.InvincibleAI &&
      typeof
        window.InvincibleAI
          .initiateTwoMinuteFix === 'function'
    ) {

      try {

        window.InvincibleAI
          .initiateTwoMinuteFix({
            source:
              'adaptive_nbm',

            subject:
              recommendation?.subject ||
              'General',

            chapter:
              recommendation?.chapter ||
              '',

            topic:
              recommendation?.topic ||
              recommendation?.concept ||
              'General',

            concept:
              recommendation?.concept ||
              recommendation?.topic ||
              'General'
          });

        return true;

      } catch (error) {

        console.warn(
          '[Adaptive Router] 2-Min Fix fallback failed:',
          error
        );
      }
    }

    console.warn(
      '[Adaptive Router] No 2-Min Fix pathway available.'
    );

    return false;
  }

  function openPractice(recommendation) {

    /*
      Practice is intentionally routed through the
      existing practice destination.

      We first use switchTab('practice') because the
      telemetry architecture already defines "practice"
      as the canonical destination.
    */

    if (
      typeof window.switchTab ===
      'function'
    ) {

      try {

        const result =
          window.switchTab('practice');

        /*
          switchTab normally does not return a useful
          value, so reaching this point means the call
          was successfully made.
        */

        return true;

      } catch (error) {

        console.warn(
          '[Adaptive Router] Practice navigation failed:',
          error
        );
      }
    }

    console.warn(
      '[Adaptive Router] Practice destination unavailable.'
    );

    return false;
  }

  function openVerify(recommendation) {

    /*
      Verification should be a learning action, not
      merely a tab click.

      If a dedicated verification function exists,
      use it. Otherwise fall back to Practice.
    */

    const verificationFunctions = [
      'startConceptVerification',
      'startVerification',
      'launchVerification'
    ];

    for (
      const functionName of
      verificationFunctions
    ) {

      if (
        typeof window[functionName] ===
        'function'
      ) {

        try {

          window[functionName](
            recommendation
          );

          return true;

        } catch (error) {

          console.warn(
            '[Adaptive Router] Verification function failed:',
            functionName,
            error
          );
        }
      }
    }

    return openPractice(
      recommendation
    );
  }

  function openRefresh(recommendation) {

    /*
      Refresh currently means revision/re-exposure.
      Reels is the existing lightweight revision
      destination.
    */

    return callSwitchTab(
      'reels'
    );
  }

  function maintain(recommendation) {

    /*
      Maintain is deliberately conservative.

      We do not send the student to a teacher/admin
      feature or invent a destination.

      Return to normal learning/home.
    */

    return callSwitchTab(
      'home'
    );
  }

  function execute(
    suppliedRecommendation
  ) {

    const recommendation =
      suppliedRecommendation ||
      getRecommendation();

    if (!recommendation) {

      console.warn(
        '[Adaptive Router] No recommendation available.'
      );

      return false;
    }

    const action =
      String(
        recommendation.action ||
        ''
      )
        .trim()
        .toLowerCase();

    let success =
      false;

    switch (action) {

      case 'fix':

        success =
          openFix(
            recommendation
          );

        break;

      case 'understand':

        success =
          openDoubtDesk(
            recommendation
          );

        break;

      case 'practice':

        success =
          openPractice(
            recommendation
          );

        break;

      case 'verify':

        success =
          openVerify(
            recommendation
          );

        break;

      case 'refresh':

        success =
          openRefresh(
            recommendation
          );

        break;

      case 'maintain':

        success =
          maintain(
            recommendation
          );

        break;

      default:

        console.warn(
          '[Adaptive Router] Unknown action:',
          action
        );

        success =
          maintain(
            recommendation
          );

        break;
    }

    /*
      Record only that the adaptive action was selected.
      This is decision telemetry, NOT mastery.
    */

    if (
      success &&
      window.InvincibleTelemetry &&
      typeof
        window.InvincibleTelemetry.emit ===
          'function'
    ) {

      window.InvincibleTelemetry.emit(
        'ADAPTIVE_ACTION_SELECTED',
        {
          source:
            'adaptive_nbm',

          action:
            action,

          subject:
            recommendation.subject ||
            'General',

          chapter:
            recommendation.chapter ||
            '',

          topic:
            recommendation.topic ||
            '',

          concept:
            recommendation.concept ||
            '',

          mastery:
            recommendation.mastery ??
            null,

          evidenceStrength:
            recommendation.evidenceStrength ??
            null
        }
      );
    }

    return success;
  }

  function getCurrentRecommendation() {
    return getRecommendation();
  }

  window[NAME] = {

    execute,

    getRecommendation:
      getCurrentRecommendation,

    version:
      '2.0.0'
  };

  /*
    Optional global helper for the existing NBM button.
    It does not replace any existing function.
  */

  if (
    typeof window.executeAdaptiveNextBestMove !==
    'function'
  ) {

    window.executeAdaptiveNextBestMove =
      function () {
        return execute();
      };
  }

  console.log(
    '[Invincible 360] Adaptive Action Router loaded.'
  );

})(window, document);