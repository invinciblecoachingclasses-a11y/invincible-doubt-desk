/* =====================================================
   INVINCIBLE 360 — ADAPTIVE RECOMMENDATION ENGINE
   Phase 2A

   Purpose:
   Decide WHAT the student should do next.

   This module:
   - Reads existing mastery
   - Reads Evidence Engine
   - Prioritizes unresolved learning problems
   - Considers recency
   - Does NOT directly modify mastery
   - Does NOT maintain a second mistake database
   - Does NOT affect teacher/admin areas
===================================================== */

(function (window) {
  'use strict';

  const ENGINE_NAME = 'InvincibleAdaptiveRecommendation';

  const ACTIONS = {
    FIX: 'fix',
    UNDERSTAND: 'understand',
    PRACTICE: 'practice',
    VERIFY: 'verify',
    REFRESH: 'refresh',
    MAINTAIN: 'maintain'
  };

  const ACTION_PRIORITY = {
    fix: 100,
    understand: 90,
    practice: 75,
    verify: 65,
    refresh: 55,
    maintain: 30
  };

  const MAX_RECOMMENDATIONS = 50;

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clean(value, fallback = '') {
    const result = String(value || '').trim();
    return result || fallback;
  }

  function now() {
    return Date.now();
  }

  function daysSince(timestamp) {
    const time = safeNumber(timestamp, 0);

    if (!time) {
      return 999;
    }

    return Math.max(
      0,
      (now() - time) / 86400000
    );
  }

  function getMasteryData() {
    if (
      !window.InvincibleTelemetry ||
      !window.InvincibleTelemetry.mastery
    ) {
      return {};
    }

    return window.InvincibleTelemetry.mastery;
  }

  function getEvidenceData() {
    if (
      !window.InvincibleEvidence ||
      typeof window.InvincibleEvidence.getAllEvidence !== 'function'
    ) {
      return {};
    }

    try {
      return (
        window.InvincibleEvidence.getAllEvidence() ||
        {}
      );
    } catch (error) {
      console.warn(
        '[Adaptive Recommendation] Evidence read failed:',
        error
      );

      return {};
    }
  }

  function getEvidenceStrength(subject, concept) {
    if (
      !window.InvincibleEvidence ||
      typeof window.InvincibleEvidence.getEvidenceStrength !== 'function'
    ) {
      return 0;
    }

    try {
      return safeNumber(
        window.InvincibleEvidence.getEvidenceStrength(
          subject,
          concept
        ),
        0
      );
    } catch (error) {
      return 0;
    }
  }

  function getUnresolvedMistakes() {
    /*
      Mistake Vault is the canonical local mistake store.
      We only READ it here.
    */

    if (
      window.InvincibleVault
    ) {
      try {

        if (
          typeof window.InvincibleVault.getMistakes === 'function'
        ) {
          const mistakes =
            window.InvincibleVault.getMistakes();

          if (Array.isArray(mistakes)) {
            return mistakes;
          }
        }

        if (
          Array.isArray(window.InvincibleVault.mistakes)
        ) {
          return window.InvincibleVault.mistakes;
        }

      } catch (error) {
        console.warn(
          '[Adaptive Recommendation] Mistake Vault read failed:',
          error
        );
      }
    }

    /*
      Fallback to the telemetry engine if it exposes
      a mistake collection.
    */

    if (
      window.InvincibleTelemetry
    ) {
      try {

        if (
          Array.isArray(
            window.InvincibleTelemetry.mistakes
          )
        ) {
          return window.InvincibleTelemetry.mistakes;
        }

      } catch (error) {}
    }

    return [];
  }

  function mistakeIdentity(mistake) {

    const subject =
      clean(
        mistake?.subject,
        'General'
      );

    const topic =
      clean(
        mistake?.topic ||
        mistake?.concept,
        'General'
      );

    const concept =
      clean(
        mistake?.concept ||
        mistake?.topic,
        topic
      );

    return {
      subject,
      topic,
      concept,
      key:
        subject.toLowerCase() +
        '::' +
        concept.toLowerCase()
    };
  }

  function getMistakeMap() {

    const map = {};

    const mistakes =
      getUnresolvedMistakes();

    mistakes.forEach(
      mistake => {

        if (!mistake) {
          return;
        }

        /*
          Only unresolved mistakes should influence
          the highest-priority FIX recommendation.
        */

        const resolved =
          mistake.resolved === true ||
          mistake.fixed === true ||
          mistake.status === 'resolved';

        if (resolved) {
          return;
        }

        const identity =
          mistakeIdentity(mistake);

        if (!map[identity.key]) {
          map[identity.key] = {
            subject:
              identity.subject,

            topic:
              identity.topic,

            concept:
              identity.concept,

            count:
              0,

            latestTimestamp:
              0,

            latestQuestion:
              '',

            mistake:
              null
          };
        }

        map[identity.key].count += 1;

        const timestamp =
          safeNumber(
            mistake.timestamp ||
            mistake.createdAt ||
            mistake.date,
            0
          );

        if (
          timestamp >=
          map[identity.key].latestTimestamp
        ) {
          map[identity.key].latestTimestamp =
            timestamp;

          map[identity.key].latestQuestion =
            clean(
              mistake.question ||
              mistake.originalQuestion,
              ''
            );

          map[identity.key].mistake =
            mistake;
        }
      }
    );

    return map;
  }

  function normalizeMasteryEntry(
    subject,
    key,
    entry
  ) {

    entry =
      entry &&
      typeof entry === 'object'
        ? entry
        : {};

    return {
      subject:
        clean(
          subject,
          'General'
        ),

      concept:
        clean(
          entry.concept ||
          entry.topic ||
          key,
          'General'
        ),

      mastery:
        Math.max(
          0,
          Math.min(
            100,
            safeNumber(
              entry.mastery,
              50
            )
          )
        ),

      accuracy:
        Math.max(
          0,
          Math.min(
            100,
            safeNumber(
              entry.accuracy,
              0
            )
          )
        ),

      attempts:
        safeNumber(
          entry.attempts,
          0
        ),

      correct:
        safeNumber(
          entry.correct,
          0
        ),

      wrongCount:
        safeNumber(
          entry.wrongCount,
          0
        ),

      confidence:
        Math.max(
          0,
          Math.min(
            100,
            safeNumber(
              entry.confidence,
              0
            )
          )
        ),

      lastPracticed:
        safeNumber(
          entry.lastPracticed,
          0
        ),

      lastVerified:
        safeNumber(
          entry.lastVerified,
          0
        ),

      lastWasCorrect:
        entry.lastWasCorrect,

      decayFlag:
        entry.decayFlag === true,

      recommendedAction:
        clean(
          entry.recommendedAction,
          'PRACTICE'
        ),

      parentTopic:
        clean(
          entry.parentTopic,
          ''
        ),

      isConcept:
        entry.isConcept === true
    };
  }

  function collectMasteryEntries() {

    const mastery =
      getMasteryData();

    const entries = [];

    Object.keys(mastery || {})
      .forEach(
        subject => {

          const subjectData =
            mastery[subject];

          if (
            !subjectData ||
            typeof subjectData !== 'object'
          ) {
            return;
          }

          Object.keys(subjectData)
            .forEach(
              key => {

                const entry =
                  subjectData[key];

                if (
                  !entry ||
                  typeof entry !== 'object'
                ) {
                  return;
                }

                entries.push(
                  normalizeMasteryEntry(
                    subject,
                    key,
                    entry
                  )
                );
              }
            );
        }
      );

    return entries;
  }

  function findEvidenceFor(
    subject,
    concept
  ) {

    const allEvidence =
      getEvidenceData();

    const subjectKey =
      clean(
        subject,
        'General'
      );

    const conceptKey =
      clean(
        concept,
        'General'
      );

    /*
      Evidence Engine stores profiles by subject/concept.
      Try the canonical key first.
    */

    const subjectData =
      allEvidence?.[subjectKey];

    if (
      subjectData &&
      typeof subjectData === 'object'
    ) {

      if (
        subjectData[conceptKey]
      ) {
        return subjectData[conceptKey];
      }

      const lower =
        conceptKey.toLowerCase();

      const match =
        Object.keys(subjectData)
          .find(
            key =>
              String(key).toLowerCase() ===
              lower
          );

      if (match) {
        return subjectData[match];
      }
    }

    return null;
  }

  function calculateEvidence(
    subject,
    concept,
    masteryEntry
  ) {

    let strength =
      getEvidenceStrength(
        subject,
        concept
      );

    const evidence =
      findEvidenceFor(
        subject,
        concept
      );

    if (
      !strength &&
      evidence
    ) {
      strength =
        safeNumber(
          evidence.score,
          0
        );
    }

    /*
      Evidence is intentionally capped.
      It influences confidence in the recommendation,
      not mastery itself.
    */

    strength =
      Math.max(
        0,
        Math.min(
          100,
          strength
        )
      );

    /*
      A verified mastery record is additional evidence,
      but only if the student actually has attempts.
    */

    if (
      masteryEntry.lastVerified &&
      masteryEntry.attempts > 0
    ) {
      strength =
        Math.min(
          100,
          strength + 10
        );
    }

    return strength;
  }

  function calculateRecency(
    masteryEntry
  ) {

    const days =
      daysSince(
        masteryEntry.lastPracticed
      );

    if (days <= 2) {
      return {
        days,
        aging: false,
        score: 100
      };
    }

    if (days <= 7) {
      return {
        days,
        aging: false,
        score: 80
      };
    }

    if (days <= 14) {
      return {
        days,
        aging: true,
        score: 60
      };
    }

    if (days <= 30) {
      return {
        days,
        aging: true,
        score: 40
      };
    }

    return {
      days,
      aging: true,
      score: 20
    };
  }

  function createRecommendation(
    action,
    entry,
    details
  ) {

    const titles = {

      fix:
        'Fix This Concept',

      understand:
        'Understand This Concept',

      practice:
        'Practice This Concept',

      verify:
        'Verify Your Understanding',

      refresh:
        'Refresh This Concept',

      maintain:
        'Keep Your Mastery Strong'
    };

    const descriptions = {

      fix:
        'You have an unresolved mistake here. Fix the misconception before moving on.',

      understand:
        'Your mastery is low. Build the concept clearly before doing more questions.',

      practice:
        'You understand part of this concept, but more practice is needed to make it reliable.',

      verify:
        'Your mastery looks promising, but the evidence is not strong enough yet. Prove it with another question.',

      refresh:
        'You previously demonstrated this concept, but it has not been practiced recently.',

      maintain:
        'Your recent evidence is strong. Keep this concept active while moving forward.'
    };

    return {
      action,
      actionTitle:
        titles[action] ||
        titles.practice,

      title:
        titles[action] ||
        titles.practice,

      description:
        descriptions[action] ||
        descriptions.practice,

      subject:
        entry.subject,

      chapter:
        entry.parentTopic ||
        '',

      topic:
        entry.concept,

      concept:
        entry.concept,

      mastery:
        Math.round(
          entry.mastery
        ),

      accuracy:
        Math.round(
          entry.accuracy
        ),

      evidenceStrength:
        Math.round(
          safeNumber(
            details.evidenceStrength,
            0
          )
        ),

      evidenceStatus:
        details.evidenceStatus,

      mistakeCount:
        safeNumber(
          details.mistakeCount,
          0
        ),

      daysSincePractice:
        Math.round(
          details.recency.days * 10
        ) / 10,

      reason:
        details.reason,

      priority:
        ACTION_PRIORITY[action] ||
        0,

      generatedAt:
        now()
    };
  }

  function decideForEntry(
    entry,
    mistakeMap
  ) {

    const key =
      (
        entry.subject +
        '::' +
        entry.concept
      ).toLowerCase();

    const mistake =
      mistakeMap[key];

    const mistakeCount =
      mistake
        ? mistake.count
        : 0;

    const evidenceStrength =
      calculateEvidence(
        entry.subject,
        entry.concept,
        entry
      );

    const evidenceStatus =
      evidenceStrength >= 60
        ? 'strong'
        : evidenceStrength >= 30
          ? 'developing'
          : 'insufficient';

    const recency =
      calculateRecency(
        entry
      );

    /*
      RULE 1
      Unresolved mistake always wins.
    */

    if (
      mistakeCount > 0
    ) {

      return createRecommendation(
        ACTIONS.FIX,
        entry,
        {
          evidenceStrength,
          evidenceStatus,
          mistakeCount,
          recency,

          reason:
            mistakeCount > 1
              ? 'Repeated unresolved mistakes detected.'
              : 'An unresolved mistake needs correction.'
        }
      );
    }

    /*
      RULE 2
      Very low mastery = understand first.
    */

    if (
      entry.mastery < 50
    ) {

      return createRecommendation(
        ACTIONS.UNDERSTAND,
        entry,
        {
          evidenceStrength,
          evidenceStatus,
          mistakeCount,
          recency,

          reason:
            'Mastery is below the reliable-learning threshold.'
        }
      );
    }

    /*
      RULE 3
      Medium mastery = practice.
    */

    if (
      entry.mastery < 75
    ) {

      return createRecommendation(
        ACTIONS.PRACTICE,
        entry,
        {
          evidenceStrength,
          evidenceStatus,
          mistakeCount,
          recency,

          reason:
            'Mastery is developing and needs more demonstrated practice.'
        }
      );
    }

    /*
      RULE 4
      High mastery but insufficient evidence = verify.
    */

    if (
      entry.mastery >= 75 &&
      evidenceStrength < 30
    ) {

      return createRecommendation(
        ACTIONS.VERIFY,
        entry,
        {
          evidenceStrength,
          evidenceStatus,
          mistakeCount,
          recency,

          reason:
            'Mastery looks high, but demonstrated evidence is still limited.'
        }
      );
    }

    /*
      RULE 5
      Strong mastery that is aging = refresh.
    */

    if (
      entry.mastery >= 75 &&
      evidenceStrength >= 30 &&
      recency.aging
    ) {

      return createRecommendation(
        ACTIONS.REFRESH,
        entry,
        {
          evidenceStrength,
          evidenceStatus,
          mistakeCount,
          recency,

          reason:
            'Strong mastery is becoming stale because the concept has not been practiced recently.'
        }
      );
    }

    /*
      RULE 6
      Strong and recent = maintain.
    */

    return createRecommendation(
      ACTIONS.MAINTAIN,
      entry,
      {
        evidenceStrength,
        evidenceStatus,
        mistakeCount,
        recency,

        reason:
          'Recent performance and evidence indicate stable understanding.'
      }
    );
  }

  function buildRecommendations() {

    const entries =
      collectMasteryEntries();

    const mistakeMap =
      getMistakeMap();

    const recommendations =
      entries
        .filter(
          entry =>
            entry.isConcept ||
            entry.attempts > 0 ||
            entry.mastery !== 50
        )
        .map(
          entry =>
            decideForEntry(
              entry,
              mistakeMap
            )
        );

    /*
      Add unresolved mistakes that do not yet have
      a mastery entry.
    */

    Object.keys(mistakeMap)
      .forEach(
        key => {

          const mistake =
            mistakeMap[key];

          const exists =
            recommendations.some(
              recommendation =>
                recommendation.subject ===
                  mistake.subject &&
                recommendation.concept ===
                  mistake.concept
            );

          if (exists) {
            return;
          }

          const syntheticEntry = {
            subject:
              mistake.subject,

            concept:
              mistake.concept,

            mastery:
              0,

            accuracy:
              0,

            attempts:
              0,

            parentTopic:
              mistake.topic,

            lastPracticed:
              mistake.latestTimestamp,

            lastVerified:
              0,

            isConcept:
              true
          };

          recommendations.push(
            createRecommendation(
              ACTIONS.FIX,
              syntheticEntry,
              {
                evidenceStrength: 0,
                evidenceStatus: 'insufficient',
                mistakeCount:
                  mistake.count,
                recency: {
                  days:
                    daysSince(
                      mistake.latestTimestamp
                    )
                },

                reason:
                  'An unresolved mistake exists even though a mastery record is not available yet.'
              }
            )
          );
        }
      );

    recommendations.sort(
      function (a, b) {

        if (
          b.priority !==
          a.priority
        ) {
          return (
            b.priority -
            a.priority
          );
        }

        if (
          b.mistakeCount !==
          a.mistakeCount
        ) {
          return (
            b.mistakeCount -
            a.mistakeCount
          );
        }

        if (
          a.mastery !==
          b.mastery
        ) {
          return (
            a.mastery -
            b.mastery
          );
        }

        return (
          b.evidenceStrength -
          a.evidenceStrength
        );
      }
    );

    return recommendations.slice(
      0,
      MAX_RECOMMENDATIONS
    );
  }

  function getRecommendation() {

    const recommendations =
      buildRecommendations();

    if (
      recommendations.length
    ) {
      return recommendations[0];
    }

    /*
      Safe fallback for a new student.
    */

    return {
      action:
        ACTIONS.PRACTICE,

      actionTitle:
        'Start Practice',

      title:
        'Start Practice',

      description:
        'Build your first learning evidence by solving a question.',

      subject:
        'General',

      chapter:
        '',

      topic:
        'General',

      concept:
        'General',

      mastery:
        0,

      accuracy:
        0,

      evidenceStrength:
        0,

      evidenceStatus:
        'insufficient',

      mistakeCount:
        0,

      daysSincePractice:
        null,

      reason:
        'There is not enough learning history yet.',

      priority:
        ACTION_PRIORITY.practice,

      generatedAt:
        now()
    };
  }

  function getAllRecommendations() {
    return buildRecommendations();
  }

  function explainRecommendation() {

    const recommendation =
      getRecommendation();

    return {
      ...recommendation,

      summary:
        recommendation.reason,

      learningDecision:
        recommendation.actionTitle
    };
  }

  window[ENGINE_NAME] = {

    getRecommendation,

    getAllRecommendations,

    explainRecommendation,

    ACTIONS,

    version:
      '2.0.0'
  };

  console.log(
    '[Invincible 360] Adaptive Recommendation Engine loaded.'
  );

})(window);