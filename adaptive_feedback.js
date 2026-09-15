/* =====================================================
   INVINCIBLE 360 — ADAPTIVE FEEDBACK ENGINE
   Phase 2E

   Measures whether an adaptive recommendation led to
   meaningful learning evidence.

   IMPORTANT:
   - Does NOT increase mastery itself.
   - Does NOT replace engine_telemetry.js.
   - Does NOT expose teacher/admin features to students.
   - Learning evidence remains the source of truth.
===================================================== */

(function (window) {
  'use strict';

  const STORAGE_KEY =
    'invincible_adaptive_feedback';

  const MAX_RECORDS = 200;

  let activeRecommendation = null;

  function loadRecords() {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY);

      const parsed =
        raw ? JSON.parse(raw) : [];

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (error) {
      console.warn(
        '[Adaptive Feedback] Could not load records:',
        error
      );

      return [];
    }
  }

  function saveRecords(records) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          records.slice(-MAX_RECORDS)
        )
      );
    } catch (error) {
      console.warn(
        '[Adaptive Feedback] Could not save records:',
        error
      );
    }
  }

  function normalize(value, fallback = '') {
    return (
      String(value ?? '')
        .trim() ||
      fallback
    );
  }

  function snapshotRecommendation() {
    if (
      !window.InvincibleAdaptiveRecommendation ||
      typeof
        window.InvincibleAdaptiveRecommendation
          .getRecommendation !== 'function'
    ) {
      return null;
    }

    try {
      const recommendation =
        window.InvincibleAdaptiveRecommendation
          .getRecommendation();

      if (!recommendation) {
        return null;
      }

      return {
        action:
          normalize(
            recommendation.action,
            'unknown'
          ),

        subject:
          normalize(
            recommendation.subject,
            'General'
          ),

        chapter:
          normalize(
            recommendation.chapter,
            ''
          ),

        topic:
          normalize(
            recommendation.topic,
            ''
          ),

        concept:
          normalize(
            recommendation.concept,
            ''
          ),

        mastery:
          Number.isFinite(
            Number(recommendation.mastery)
          )
            ? Number(recommendation.mastery)
            : null,

        evidenceStrength:
          Number.isFinite(
            Number(
              recommendation.evidenceStrength
            )
          )
            ? Number(
                recommendation.evidenceStrength
              )
            : null
      };
    } catch (error) {
      console.warn(
        '[Adaptive Feedback] Recommendation snapshot failed:',
        error
      );

      return null;
    }
  }

  function startRecommendation() {
    const recommendation =
      snapshotRecommendation();

    if (!recommendation) {
      return;
    }

    activeRecommendation = {
      ...recommendation,

      startedAt:
        Date.now(),

      eventCount:
        0
    };
  }

  function isSameConcept(
    recommendation,
    payload
  ) {
    if (!recommendation) {
      return false;
    }

    const recSubject =
      normalize(
        recommendation.subject,
        'General'
      ).toLowerCase();

    const eventSubject =
      normalize(
        payload?.subject,
        'General'
      ).toLowerCase();

    if (
      recSubject !== eventSubject
    ) {
      return false;
    }

    const recConcept =
      normalize(
        recommendation.concept,
        ''
      ).toLowerCase();

    const eventConcept =
      normalize(
        payload?.concept,
        ''
      ).toLowerCase();

    const recTopic =
      normalize(
        recommendation.topic,
        ''
      ).toLowerCase();

    const eventTopic =
      normalize(
        payload?.topic,
        ''
      ).toLowerCase();

    /*
      If a real concept exists, prefer concept
      matching. Otherwise use topic.
    */

    if (recConcept) {
      return (
        recConcept === eventConcept ||
        recConcept === eventTopic
      );
    }

    if (recTopic) {
      return (
        recTopic === eventTopic ||
        recTopic === eventConcept
      );
    }

    return true;
  }

  function evaluateEvent(
    eventName,
    payload
  ) {
    if (!activeRecommendation) {
      return;
    }

    if (
      !isSameConcept(
        activeRecommendation,
        payload
      )
    ) {
      return;
    }

    activeRecommendation.eventCount++;

    /*
      These events represent meaningful evidence
      after an adaptive action.
    */

    const positiveEvents = [
      'QUESTION_SOLVED',
      'MISTAKE_RECOVERED',
      'QUESTION_MASTERED',
      'PRACTICE_COMPLETED',
      'DOUBT_SOLVED',
      'TEST_SUBMITTED',
      'LAB_COMPLETED'
    ];

    const negativeEvents = [
      'QUESTION_WRONG',
      'MISTAKE_LOGGED'
    ];

    let outcome =
      'neutral';

    if (
      positiveEvents.includes(eventName)
    ) {
      outcome = 'positive';
    }

    if (
      negativeEvents.includes(eventName)
    ) {
      outcome = 'negative';
    }

    if (outcome === 'neutral') {
      return;
    }

    const record = {
      recommendation:
        { ...activeRecommendation },

      outcome,

      triggeringEvent:
        eventName,

      eventPayload:
        payload || {},

      completedAt:
        Date.now(),

      durationSeconds:
        Math.max(
          0,
          Math.round(
            (
              Date.now() -
              activeRecommendation.startedAt
            ) / 1000
          )
        )
    };

    const records =
      loadRecords();

    records.push(record);

    saveRecords(records);

    /*
      One recommendation should normally resolve
      against the first meaningful outcome.

      This prevents one session from generating
      multiple artificial "successes".
    */

    activeRecommendation =
      null;
  }

  function handleEvent(event) {
    if (!event) {
      return;
    }

    const eventName =
      event.name ||
      event.eventName ||
      event.type ||
      '';

    const payload =
      event.payload ||
      event.data ||
      {};

    if (
      eventName ===
      'ADAPTIVE_ACTION_SELECTED'
    ) {
      startRecommendation();
      return;
    }

    evaluateEvent(
      eventName,
      payload
    );
  }

  function getRecords() {
    return loadRecords();
  }

  function getStats() {
    const records =
      loadRecords();

    const stats = {
      total: records.length,
      positive: 0,
      negative: 0,
      neutral: 0,
      successRate: 0
    };

    records.forEach(
      function (record) {

        if (
          record.outcome ===
          'positive'
        ) {
          stats.positive++;
        }

        else if (
          record.outcome ===
          'negative'
        ) {
          stats.negative++;
        }

        else {
          stats.neutral++;
        }
      }
    );

    const resolved =
      stats.positive +
      stats.negative;

    stats.successRate =
      resolved > 0
        ? Math.round(
            (
              stats.positive /
              resolved
            ) * 100
          )
        : 0;

    return stats;
  }

  function reset() {
    activeRecommendation =
      null;

    try {
      localStorage.removeItem(
        STORAGE_KEY
      );
    } catch (error) {
      console.warn(
        '[Adaptive Feedback] Reset failed:',
        error
      );
    }
  }

  /*
    Some versions of the telemetry event bus pass
    the event name directly rather than nesting it.
  */

  if (
    window.InvincibleTelemetry &&
    typeof
      window.InvincibleTelemetry.on ===
        'function'
  ) {

    const importantEvents = [
      'ADAPTIVE_ACTION_SELECTED',
      'QUESTION_SOLVED',
      'QUESTION_WRONG',
      'MISTAKE_RECOVERED',
      'QUESTION_MASTERED',
      'PRACTICE_COMPLETED',
      'DOUBT_SOLVED',
      'TEST_SUBMITTED',
      'LAB_COMPLETED'
    ];

    importantEvents.forEach(
      function (eventName) {

        window.InvincibleTelemetry.on(
          eventName,
          function (payload) {

            handleEvent({
              name: eventName,
              payload:
                payload || {}
            });

          }
        );
      }
    );
  }

  window.InvincibleAdaptiveFeedback = {

    getRecords,

    getStats,

    getActiveRecommendation:
      function () {
        return activeRecommendation
          ? {
              ...activeRecommendation
            }
          : null;
      },

    reset,

    version:
      '2.0.0'
  };

  console.log(
    '[Invincible 360] Adaptive Feedback Engine loaded.'
  );

})(window);