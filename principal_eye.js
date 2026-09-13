/* =====================================================
   INVINCIBLE 360 — PRINCIPAL'S EYE
   Phase 3A

   Teacher/Admin intelligence layer.

   PURPOSE:
   Detect learning-system anomalies from existing
   canonical learning evidence.

   IMPORTANT:
   - NEVER expose this to students.
   - Does NOT modify student mastery.
   - Does NOT modify engine_telemetry.js.
   - This is an intelligence layer, not a punishment layer.
===================================================== */

(function (window) {
  'use strict';

  const NAME =
    'InvinciblePrincipalEye';

  const STORAGE_KEY =
    'invincible_principal_eye';

  function safeNumber(value, fallback = 0) {
    const n = Number(value);

    return Number.isFinite(n)
      ? n
      : fallback;
  }

  function safeString(
    value,
    fallback = ''
  ) {
    return (
      String(value ?? '').trim() ||
      fallback
    );
  }

  function getEvidence() {

    if (
      !window.InvincibleEvidence ||
      typeof
        window.InvincibleEvidence
          .getAllEvidence !== 'function'
    ) {
      return [];
    }

    try {
      const result =
        window.InvincibleEvidence
          .getAllEvidence();

      return Array.isArray(result)
        ? result
        : Object.values(result || {});
    } catch (error) {

      console.warn(
        '[Principal Eye] Evidence read failed:',
        error
      );

      return [];
    }
  }

  function normalizeEvidence(item) {

    return {

      studentId:
        safeString(
          item.studentId ||
          item.student_id,
          'unknown'
        ),

      subject:
        safeString(
          item.subject,
          'General'
        ),

      chapter:
        safeString(
          item.chapter,
          ''
        ),

      topic:
        safeString(
          item.topic ||
          item.concept,
          'General'
        ),

      concept:
        safeString(
          item.concept ||
          item.topic,
          'General'
        ),

      score:
        safeNumber(
          item.score,
          0
        ),

      correct:
        safeNumber(
          item.correct,
          0
        ),

      wrong:
        safeNumber(
          item.wrong,
          0
        ),

      attempts:
        safeNumber(
          item.attempts,
          0
        ),

      lastActivity:
        safeNumber(
          item.lastActivity ||
          item.lastTimestamp ||
          item.updatedAt,
          0
        )
    };
  }

  function calculateRisk(item) {

    const evidence =
      normalizeEvidence(item);

    const totalAttempts =
      evidence.correct +
      evidence.wrong;

    const accuracy =
      totalAttempts > 0
        ? (
            evidence.correct /
            totalAttempts
          ) * 100
        : null;

    const risks = [];

    /*
      1. Repeated wrong answers
    */

    if (
      evidence.wrong >= 3 &&
      accuracy !== null &&
      accuracy < 50
    ) {

      risks.push({
        type:
          'REPEATED_FAILURE',

        severity:
          'HIGH',

        reason:
          'Repeated incorrect responses indicate a persistent learning difficulty.'
      });
    }

    /*
      2. Low evidence
    */

    if (
      evidence.attempts >= 3 &&
      evidence.score < 20
    ) {

      risks.push({
        type:
          'LOW_EVIDENCE',

        severity:
          'MEDIUM',

        reason:
          'The student has activity but insufficient demonstrated understanding.'
      });
    }

    /*
      3. Strong activity but weak outcome
    */

    if (
      evidence.attempts >= 5 &&
      accuracy !== null &&
      accuracy < 40
    ) {

      risks.push({
        type:
          'HIGH_ACTIVITY_LOW_OUTCOME',

        severity:
          'HIGH',

        reason:
          'Repeated activity is not translating into successful learning.'
      });
    }

    /*
      4. No recent activity
    */

    if (
      evidence.lastActivity > 0
    ) {

      const ageDays =
        (
          Date.now() -
          evidence.lastActivity
        ) /
        86400000;

      if (
        ageDays >= 14
      ) {

        risks.push({
          type:
            'LEARNING_INACTIVITY',

          severity:
            'MEDIUM',

          reason:
            'There has been no meaningful learning evidence recently.'
        });
      }
    }

    return {

      ...evidence,

      accuracy,

      riskCount:
        risks.length,

      risks
    };
  }

  function analyze() {

    const evidence =
      getEvidence();

    return evidence
      .map(calculateRisk)
      .filter(
        item =>
          item.riskCount > 0
      )
      .sort(
        function (a, b) {

          const severityScore =
            {
              HIGH: 3,
              MEDIUM: 2,
              LOW: 1
            };

          const aScore =
            a.risks.reduce(
              (sum, risk) =>
                sum +
                (
                  severityScore[
                    risk.severity
                  ] || 0
                ),
              0
            );

          const bScore =
            b.risks.reduce(
              (sum, risk) =>
                sum +
                (
                  severityScore[
                    risk.severity
                  ] || 0
                ),
              0
            );

          return bScore - aScore;
        }
      );
  }

  function getSummary() {

    const risks =
      analyze();

    const summary = {

      studentsAffected:
        new Set(
          risks.map(
            item =>
              item.studentId
          )
        ).size,

      high:
        0,

      medium:
        0,

      totalRiskSignals:
        0
    };

    risks.forEach(
      function (item) {

        item.risks.forEach(
          function (risk) {

            summary.totalRiskSignals++;

            if (
              risk.severity ===
              'HIGH'
            ) {
              summary.high++;
            }

            if (
              risk.severity ===
              'MEDIUM'
            ) {
              summary.medium++;
            }
          }
        );
      }
    );

    return summary;
  }

  function getInterventionQueue() {

    return analyze()
      .map(
        function (item) {

          const highestRisk =
            item.risks[0];

          return {

            studentId:
              item.studentId,

            subject:
              item.subject,

            chapter:
              item.chapter,

            topic:
              item.topic,

            concept:
              item.concept,

            accuracy:
              item.accuracy,

            attempts:
              item.attempts,

            priority:
              highestRisk?.severity ||
              'LOW',

            issue:
              highestRisk?.type ||
              'UNKNOWN',

            reason:
              highestRisk?.reason ||
              'Learning signal requires review.',

            recommendedAction:
              item.risks.some(
                risk =>
                  risk.type ===
                  'REPEATED_FAILURE'
              )
                ? 'TEACHER_INTERVENTION'
                : 'REVIEW_PROGRESS'
          };
        }
      );
  }

  function getConceptHeatmap() {

    const evidence =
      getEvidence();

    const map = {};

    evidence.forEach(
      function (item) {

        const e =
          normalizeEvidence(
            item
          );

        const key =
          [
            e.subject,
            e.chapter,
            e.concept
          ]
            .join('::');

        if (!map[key]) {

          map[key] = {

            subject:
              e.subject,

            chapter:
              e.chapter,

            concept:
              e.concept,

            attempts:
              0,

            correct:
              0,

            wrong:
              0
          };
        }

        map[key].attempts +=
          e.attempts;

        map[key].correct +=
          e.correct;

        map[key].wrong +=
          e.wrong;
      }
    );

    return Object.values(map)
      .map(
        function (item) {

          const total =
            item.correct +
            item.wrong;

          item.accuracy =
            total > 0
              ? Math.round(
                  (
                    item.correct /
                    total
                  ) * 100
                )
              : 0;

          return item;
        }
      );
  }

  function reset() {

    try {
      localStorage.removeItem(
        STORAGE_KEY
      );
    } catch (error) {

      console.warn(
        '[Principal Eye] Reset failed:',
        error
      );
    }
  }

  window[NAME] = {

    analyze,

    getSummary,

    getInterventionQueue,

    getConceptHeatmap,

    reset,

    version:
      '3.0.0'
  };

  console.log(
    '[Invincible 360] Principal’s Eye loaded.'
  );

})(window);