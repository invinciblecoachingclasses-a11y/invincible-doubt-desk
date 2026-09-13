/* =====================================================
   INVINCIBLE 360 — ADAPTIVE NBM BRIDGE
   Phase 2C

   Connects the adaptive recommendation engine to the
   EXISTING Next Best Move card.

   IMPORTANT:
   - Does not modify engine_telemetry.js
   - Does not create a second NBM card
   - Does not change existing styling
   - Student-side only
   - Falls back safely to the existing NBM
===================================================== */

(function (window) {
  'use strict';

  const BRIDGE_NAME =
    'InvincibleAdaptiveNBMBridge';

  let lastRecommendationKey = '';

  function adaptiveEngineReady() {
    return (
      window.InvincibleAdaptiveRecommendation &&
      typeof
        window.InvincibleAdaptiveRecommendation
          .getRecommendation === 'function'
    );
  }

  function getRecommendation() {
    if (!adaptiveEngineReady()) {
      return null;
    }

    try {
      return window.InvincibleAdaptiveRecommendation
        .getRecommendation();
    } catch (error) {
      console.warn(
        '[Adaptive NBM] Recommendation failed:',
        error
      );

      return null;
    }
  }

  function findElement(ids) {
    for (const id of ids) {
      const element =
        document.getElementById(id);

      if (element) {
        return element;
      }
    }

    return null;
  }

  function findActionButton(card) {
    if (!card) {
      return null;
    }

    /*
      Prefer an explicit NBM action button if one exists.
    */

    const explicit =
      findElement([
        'nextBestMoveAction',
        'nbmActionButton',
        'nextBestMoveBtn'
      ]);

    if (explicit) {
      return explicit;
    }

    /*
      Otherwise look inside the existing card.
    */

    const buttons =
      card.querySelectorAll(
        'button'
      );

    if (!buttons.length) {
      return null;
    }

    /*
      The first button in the NBM card is normally
      the primary CTA.
    */

    return buttons[0];
  }

  function findCard() {
    return document.getElementById(
      'nextBestMoveCard'
    );
  }

  function getTextNodes(card) {
    if (!card) {
      return [];
    }

    return Array.from(
      card.querySelectorAll(
        'h1, h2, h3, h4, p, div, span'
      )
    );
  }

  function updateExistingCard(
    recommendation
  ) {

    const card =
      findCard();

    if (!card) {
      return false;
    }

    /*
      We intentionally update only obvious text
      targets. Existing layout/styling remains untouched.
    */

    const title =
      findElement([
        'nextBestMoveTitle',
        'nbmTitle'
      ]);

    const description =
      findElement([
        'nextBestMoveDescription',
        'nbmDescription',
        'nextBestMoveReason'
      ]);

    const actionButton =
      findActionButton(card);

    if (title) {
      title.textContent =
        recommendation.actionTitle ||
        recommendation.title ||
        'Your Next Best Move';
    }

    if (description) {
      description.textContent =
        recommendation.description ||
        recommendation.reason ||
        '';
    }

    /*
      If explicit targets do not exist, do not blindly
      rewrite the card. The existing UI stays intact.
    */

    if (
      actionButton &&
      recommendation.actionTitle
    ) {
      actionButton.textContent =
        recommendation.actionTitle;
    }

    /*
      Store the recommendation on the card so other
      student-side code can inspect it without creating
      another state store.
    */

    card.dataset.adaptiveAction =
      recommendation.action ||
      '';

    card.dataset.adaptiveSubject =
      recommendation.subject ||
      '';

    card.dataset.adaptiveConcept =
      recommendation.concept ||
      '';

    card.dataset.adaptiveMastery =
      String(
        recommendation.mastery ?? ''
      );

    return true;
  }

  function recommendationKey(
    recommendation
  ) {

    if (!recommendation) {
      return '';
    }

    return [
      recommendation.action,
      recommendation.subject,
      recommendation.chapter,
      recommendation.topic,
      recommendation.concept,
      recommendation.mastery
    ]
      .map(
        value =>
          String(value || '')
      )
      .join('|');
  }

  function exposeRecommendation() {

    const recommendation =
      getRecommendation();

    if (!recommendation) {
      return null;
    }

    window.InvincibleAdaptiveNBM =
      window.InvincibleAdaptiveNBM || {};

    window.InvincibleAdaptiveNBM
      .recommendation =
        recommendation;

    return recommendation;
  }

  function refresh() {

    const recommendation =
      exposeRecommendation();

    if (!recommendation) {
      return;
    }

    const key =
      recommendationKey(
        recommendation
      );

    /*
      Avoid repeatedly rewriting the same card.
    */

    if (
      key === lastRecommendationKey
    ) {
      return;
    }

    lastRecommendationKey =
      key;

    updateExistingCard(
      recommendation
    );
  }

  function install() {

    if (
      !adaptiveEngineReady()
    ) {
      return;
    }

    /*
      Give the existing dashboard a moment to finish
      rendering before touching its card.
    */

    refresh();

    /*
      Refresh when meaningful learning events occur.
      This makes the NBM adaptive without polling
      continuously.
    */

    if (
      window.InvincibleTelemetry &&
      typeof
        window.InvincibleTelemetry.on ===
          'function'
    ) {

      const events = [
        'MISTAKE_LOGGED',
        'MISTAKE_RECOVERED',
        'QUESTION_SOLVED',
        'QUESTION_WRONG',
        'TEST_SUBMITTED',
        'PRACTICE_COMPLETED',
        'PRACTICE_STARTED',
        'DOUBT_SOLVED',
        'REEL_RESOLVED',
        'LAB_COMPLETED',
        'ARENA_FINISHED'
      ];

      events.forEach(
        eventName => {

          const flag =
            '__adaptiveNBM_' +
            eventName;

          if (
            window[flag]
          ) {
            return;
          }

          window[flag] =
            true;

          window.InvincibleTelemetry.on(
            eventName,
            function () {

              /*
                Let telemetry/mastery/evidence finish
                updating before calculating the next move.
              */

              setTimeout(
                refresh,
                50
              );
            }
          );
        }
      );
    }

    /*
      Public API for manual refresh/debugging.
    */

    window.InvincibleAdaptiveNBM =
      window.InvincibleAdaptiveNBM || {};

    window.InvincibleAdaptiveNBM.refresh =
      refresh;

    window.InvincibleAdaptiveNBM
      .getRecommendation =
        getRecommendation;

    window.InvincibleAdaptiveNBM.version =
      '2.0.0';

    console.log(
      '[Invincible 360] Adaptive NBM Bridge loaded.'
    );
  }

  /*
    Initial installation.
  */

  install();

  /*
    Retry because app.html may render the NBM card
    after the scripts have loaded.
  */

  setTimeout(
    install,
    500
  );

  setTimeout(
    install,
    1500
  );

  setTimeout(
    install,
    3000
  );

})(window);