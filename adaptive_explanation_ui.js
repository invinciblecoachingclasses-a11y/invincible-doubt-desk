/* =====================================================
   INVINCIBLE 360 — ADAPTIVE EXPLANATION UI
   Phase 2G

   Connects adaptive explanations to the existing
   Next Best Move card.

   Does NOT modify engine_telemetry.js.
===================================================== */

(function (window, document) {
  'use strict';

  const NAME =
    'InvincibleAdaptiveExplanationUI';

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
        '[Adaptive Explanation UI] Recommendation error:',
        error
      );

      return null;
    }
  }

  function getExplanation(recommendation) {
    if (
      !window.InvincibleAdaptiveExplanation ||
      typeof window.InvincibleAdaptiveExplanation
        .explain !== 'function'
    ) {
      return null;
    }

    try {
      return window.InvincibleAdaptiveExplanation
        .explain(recommendation);
    } catch (error) {
      console.warn(
        '[Adaptive Explanation UI] Explanation error:',
        error
      );

      return null;
    }
  }

  function findOrCreateReason(card) {

    let reason =
      document.getElementById(
        'nbmReason'
      );

    if (
      reason &&
      card.contains(reason)
    ) {
      return reason;
    }

    /*
      Create the explanation area inside the existing
      NBM card. This avoids modifying app.html.
    */

    reason =
      document.createElement('div');

    reason.id =
      'nbmReason';

    reason.style.margin =
      '8px 0 14px 0';

    reason.style.padding =
      '10px 12px';

    reason.style.borderRadius =
      '12px';

    reason.style.background =
      'rgba(255,255,255,0.04)';

    reason.style.border =
      '1px solid rgba(255,255,255,0.07)';

    reason.style.fontSize =
      '12px';

    reason.style.lineHeight =
      '1.5';

    reason.style.color =
      '#B8C3D6';

    /*
      Insert after the title when possible.
    */

    const title =
      document.getElementById(
        'nbmTitle'
      );

    if (
      title &&
      card.contains(title)
    ) {
      title.insertAdjacentElement(
        'afterend',
        reason
      );
    } else {
      card.appendChild(reason);
    }

    return reason;
  }

  function update() {

    const card =
      document.getElementById(
        'nextBestMoveCard'
      );

    if (!card) {
      return false;
    }

    const recommendation =
      getRecommendation();

    if (!recommendation) {
      return false;
    }

    const explanation =
      getExplanation(
        recommendation
      );

    if (!explanation) {
      return false;
    }

    const reason =
      findOrCreateReason(
        card
      );

    if (!reason) {
      return false;
    }

    /*
      Keep the existing NBM title controlled by the
      existing adaptive bridge.

      This module only adds the WHY.
    */

    reason.innerHTML =
      '<div style="' +
      'font-size:10px;' +
      'font-weight:900;' +
      'letter-spacing:0.8px;' +
      'text-transform:uppercase;' +
      'color:var(--accent-cyan);' +
      'margin-bottom:4px;' +
      '">' +
      'WHY THIS MOVE?' +
      '</div>' +

      '<div style="' +
      'color:#E8EDF5;' +
      'font-weight:600;' +
      '">' +
      escapeHTML(
        explanation.message ||
        ''
      ) +
      '</div>';

    card.dataset.adaptiveAction =
      recommendation.action ||
      '';

    card.dataset.adaptiveConcept =
      recommendation.concept ||
      recommendation.topic ||
      '';

    return true;
  }

  function escapeHTML(value) {

    const div =
      document.createElement(
        'div'
      );

    div.textContent =
      String(value || '');

    return div.innerHTML;
  }

  function install() {

    update();

    /*
      Existing dashboard components may render after
      the initial page load, so retry briefly.
    */

    setTimeout(update, 250);
    setTimeout(update, 750);
    setTimeout(update, 1500);
    setTimeout(update, 3000);
  }

  /*
    Refresh whenever a learning event changes the
    student's adaptive state.
  */

  if (
    window.InvincibleTelemetry &&
    typeof
      window.InvincibleTelemetry.on ===
        'function'
  ) {

    const events = [
      'TEST_SUBMITTED',
      'QUESTION_SOLVED',
      'QUESTION_WRONG',
      'MISTAKE_RECOVERED',
      'MISTAKE_LOGGED',
      'DOUBT_SOLVED',
      'PRACTICE_COMPLETED',
      'LAB_COMPLETED',
      'ARENA_FINISHED'
    ];

    events.forEach(
      function (eventName) {

        window.InvincibleTelemetry.on(
          eventName,
          function () {

            setTimeout(
              update,
              100
            );

          }
        );
      }
    );
  }

  window[NAME] = {
    update,

    version:
      '2.0.0'
  };

  install();

  console.log(
    '[Invincible 360] Adaptive Explanation UI loaded.'
  );

})(window, document);