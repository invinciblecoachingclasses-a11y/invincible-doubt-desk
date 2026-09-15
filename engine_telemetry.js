/* =====================================================
   ⚡ INVINCIBLE 360 - UNIFIED EVENT & MASTERY ENGINE

   Core Modules:
   1. Centralized Event Bus (InvincibleTelemetry.emit)
   2. Dynamic Concept Mastery Tracking & Sub-skill Matrix
   3. Spaced-Repetition Knowledge Decay Algorithm (Ebbinghaus)
   4. Unified XP, Streak & Progression Manager
   5. Intelligent "Next Best Move" Recommendation Generator
   6. Supabase Cloud Sync (Learning Events & Mastery States)
===================================================== */

(function(window) {
  'use strict';

  const STORAGE_KEY_MASTERY = 'invincible_concept_mastery';
  const STORAGE_KEY_EVENTS = 'invincible_event_log';
  const STORAGE_KEY_RECS = 'invincible_recommendations';

  const DEFAULT_SKILLS = {
    concepts: 70,
    numericals: 60,
    diagrams: 65,
    application: 60
  };

  class TelemetryEngine {

    constructor() {
      this.mastery = this.loadMastery();
      this.eventQueue = this.loadEvents();
      this.syncQueue = [];
      this.subscribers = {};

      this.initDecayEngine();

      this.syncInterval = setInterval(
        () => this.flushQueueToSupabase(),
        15000
      );
    }


    /* --------------------------------------------------
       1. EVENT BUS & EMITTER
    -------------------------------------------------- */

    on(eventName, callback) {

      if (!this.subscribers[eventName]) {
        this.subscribers[eventName] = [];
      }

      this.subscribers[eventName].push(callback);
    }


    normalizeLearningPayload(
      eventName,
      payload = {}
    ) {

      const safePayload =
        payload &&
        typeof payload === 'object'
          ? { ...payload }
          : {};


      /* -------------------------------------------------
         CANONICAL LEARNING IDENTITY
      ------------------------------------------------- */

      const subject =
        String(
          safePayload.subject ||
          'General'
        ).trim() || 'General';


      const chapter =
        String(
          safePayload.chapter ||
          safePayload.parentTopic ||
          safePayload.chapterName ||
          ''
        ).trim();


      const topic =
        String(
          safePayload.topic ||
          safePayload.topicName ||
          ''
        ).trim();


      const concept =
        String(
          safePayload.concept ||
          ''
        ).trim();


      const question =
        String(
          safePayload.question ||
          safePayload.originalQuestion ||
          ''
        ).trim();


      /* -------------------------------------------------
         CANONICAL SOURCE
      ------------------------------------------------- */

      let source =
        String(
          safePayload.source ||
          ''
        ).trim();


      if (!source) {

        const sourceMap = {

          DOUBT_ASKED:
            'doubt',

          DOUBT_SOLVED:
            'doubt',

          MISTAKE_LOGGED:
            'test',

          MISTAKE_RECOVERED:
            '2_min_fix',

          TEST_SUBMITTED:
            'test',

          QUESTION_SOLVED:
            'practice',

          QUESTION_WRONG:
            'practice',

          QUESTION_MASTERED:
            'practice',

          REEL_RESOLVED:
            'reels',

          LAB_COMPLETED:
            'lab',

          ARENA_FINISHED:
            'arena',

          PRACTICE_STARTED:
            'practice',

          PRACTICE_COMPLETED:
            'practice',

          FOLLOWUP_ASKED:
            'doubt',

          TEACHER_HELP_REQUESTED:
            'teacher_help'
        };


        source =
          sourceMap[eventName] ||
          'system';
      }


      /* -------------------------------------------------
         CANONICAL RESULT
      ------------------------------------------------- */

      let result =
        safePayload.result ||
        '';


      if (!result) {

        if (
          safePayload.isCorrect === true
        ) {

          result = 'correct';

        } else if (
          safePayload.isCorrect === false
        ) {

          result = 'wrong';

        } else if (
          eventName === 'MISTAKE_RECOVERED'
        ) {

          result = 'recovered';

        } else if (
          eventName === 'DOUBT_SOLVED'
        ) {

          result = 'solved';

        } else if (
          eventName === 'MISTAKE_LOGGED'
        ) {

          result = 'wrong';
        }
      }


      /* -------------------------------------------------
         RETURN ORIGINAL PAYLOAD + CANONICAL FIELDS
      ------------------------------------------------- */

      return {

        ...safePayload,

        studentId:
          safePayload.studentId ||
          null,

        subject,

        chapter,

        topic,

        concept,

        question,

        source,

        result,

        eventVersion:
          1
      };
    }


    emit(
      eventName,
      payload = {}
    ) {

      const normalizedPayload =
        this.normalizeLearningPayload(
          eventName,
          payload
        );


      const eventRecord = {

        id:
          'evt_' +
          Date.now() +
          '_' +
          Math.random()
            .toString(36)
            .substr(2, 5),

        type:
          eventName,

        timestamp:
          Date.now(),

        payload:
          normalizedPayload
      };


      this.logEvent(
        eventRecord
      );


      this.processTelemetry(
        eventRecord
      );


      if (
        this.subscribers[eventName]
      ) {

        this.subscribers[eventName]
          .forEach(
            cb => {

              try {

                cb(
                  normalizedPayload,
                  eventRecord
                );

              } catch(e) {

                console.error(
                  `[Telemetry Error: ${eventName}]`,
                  e
                );

              }

            }
          );
      }


      window.dispatchEvent(
        new CustomEvent(
          'invincible:event',
          {
            detail:
              eventRecord
          }
        )
      );
    }


    logEvent(
      eventRecord
    ) {

      this.eventQueue.push(
        eventRecord
      );

      this.syncQueue.push(
        eventRecord
      );


      if (
        this.eventQueue.length > 250
      ) {

        this.eventQueue.shift();
      }


      try {

        localStorage.setItem(
          STORAGE_KEY_EVENTS,
          JSON.stringify(
            this.eventQueue
          )
        );

      } catch(e) {}
    }


    /* --------------------------------------------------
       2. TELEMETRY & MASTERY PROCESSING
    -------------------------------------------------- */

    processTelemetry(
      event
    ) {

      const {
        type,
        payload
      } = event;


      switch(type) {

        case 'REEL_RESOLVED':

          this.updateReelMastery(
            payload
          );

          break;


        case 'ARENA_FINISHED':

          this.updateArenaMastery(
            payload
          );

          break;


        case 'LAB_COMPLETED':

          this.updateLabMastery(
            payload
          );

          break;


        case 'TEST_SUBMITTED':

          this.updateTestMastery(
            payload
          );

          break;


        case 'MISTAKE_RECOVERED':

          this.updateMistakeRecovery(
            payload
          );

          break;


        case 'DOUBT_SOLVED':

          this.updateDoubtMastery(
            payload
          );

          break;


        case '2_MIN_FIX_COMPLETED':

          /*
             Completion is recorded as a learning event.

             Mastery is updated only by MISTAKE_RECOVERED
             after the student successfully proves the concept.
          */

          break;
      }


      this.saveMastery();
    }


    updateReelMastery(
      payload
    ) {

      const {
        subject,
        topic,
        isCorrect,
        timeTaken,
        isBoss,
        question,
        yourAnswer,
        correctAnswer,
        explanation
      } = payload;


      const entry =
        this.getTopicEntry(
          subject,
          topic
        );


      entry.attempts += 1;


      if (isCorrect) {

        entry.correct += 1;

        entry.mastery =
          Math.min(
            100,
            entry.mastery + 6
          );

        entry.skills.concepts =
          Math.min(
            100,
            entry.skills.concepts + 6
          );

      } else {

        entry.mastery =
          Math.max(
            15,
            entry.mastery - 4
          );

        entry.skills.concepts =
          Math.max(
            10,
            entry.skills.concepts - 4
          );


        this.emit(
          'MISTAKE_LOGGED',
          {

            subject:
              subject ||
              'Science',

            topic:
              topic ||
              'General Concept',

            question:
              question,

            yourAnswer:
              yourAnswer,

            correctAnswer:
              correctAnswer,

            category:
              'Concept Trap',

            explanation:
              explanation ||
              'Review the core formula and verify sign conventions.',

            source:
              'reel'
          }
        );
      }


      entry.lastPracticed =
        Date.now();
    }


    updateArenaMastery({
      subject,
      chapter,
      won,
      accuracy,
      comboStreak
    }) {

      const entry =
        this.getTopicEntry(
          subject,
          chapter ||
          'General Syllabus'
        );


      entry.attempts += 5;


      const delta =
        won
          ? (
              accuracy >= 80
                ? 8
                : 5
            )
          : -3;


      entry.mastery =
        Math.max(
          10,
          Math.min(
            100,
            entry.mastery + delta
          )
        );


      entry.skills.application =
        Math.max(
          10,
          Math.min(
            100,
            entry.skills.application + delta
          )
        );


      if (
        comboStreak >= 3
      ) {

        entry.skills.numericals =
          Math.min(
            100,
            entry.skills.numericals + 6
          );
      }


      entry.lastPracticed =
        Date.now();
    }


    updateLabMastery({
      subject,
      labName,
      hypothesisCorrect
    }) {

      const entry =
        this.getTopicEntry(
          subject ||
          'Science',
          labName
        );


      const gain =
        hypothesisCorrect
          ? 12
          : 6;


      entry.mastery =
        Math.min(
          100,
          entry.mastery + gain
        );


      entry.skills.diagrams =
        Math.min(
          100,
          entry.skills.diagrams + gain
        );


      entry.skills.application =
        Math.min(
          100,
          entry.skills.application + gain
        );


      entry.lastPracticed =
        Date.now();
    }


    updateTestMastery({
      subject,
      chapter,
      percentage,
      attempted,
      correct,
      questions = []
    }) {

      const safeSubject =
        String(
          subject ||
          'General'
        ).trim() ||
        'General';


      const safeChapter =
        String(
          chapter ||
          'General'
        ).trim() ||
        'General';


      const chapterEntry =
        this.getTopicEntry(
          safeSubject,
          safeChapter
        );


      /* -----------------------------------------------
         1. OVERALL TEST PERFORMANCE
      ------------------------------------------------ */

      chapterEntry.attempts +=
        Number(attempted) ||
        0;


      chapterEntry.correct +=
        Number(correct) ||
        0;


      const testDelta =
        Math.round(
          (
            Number(percentage) -
            chapterEntry.mastery
          ) * 0.25
        );


      chapterEntry.mastery =
        Math.max(
          10,
          Math.min(
            100,
            chapterEntry.mastery +
            testDelta
          )
        );


      chapterEntry.skills.numericals =
        Math.max(
          10,
          Math.min(
            100,
            chapterEntry.skills.numericals +
            (
              Number(percentage) >= 70
                ? 8
                : -6
            )
          )
        );


      chapterEntry.lastPracticed =
        Date.now();


      /* -----------------------------------------------
         2. INDIVIDUAL QUESTION CONCEPTS
      ------------------------------------------------ */

      if (
        !Array.isArray(questions)
      ) {

        return;
      }


      questions.forEach(
        q => {

          if (!q) {
            return;
          }


          const topic =
            String(
              q.topic ||
              ''
            ).trim();


          const concept =
            String(
              q.concept ||
              ''
            ).trim();


          /*
             Do not invent a concept
             if metadata is unavailable.
          */

          if (
            !topic &&
            !concept
          ) {

            return;
          }


          const conceptKey =
            concept ||
            topic;


          const conceptEntry =
            this.getTopicEntry(
              safeSubject,
              conceptKey
            );


          /*
             This entry came from an actual
             test question.
          */

          conceptEntry.isConcept =
            true;


          /*
             Every answered question is
             an attempt.
          */

          conceptEntry.attempts +=
            1;


          if (
            q.isCorrect === true
          ) {

            conceptEntry.correct +=
              1;


            conceptEntry.lastQuestion =
              String(
                q.question ||
                ''
              ).trim();


            conceptEntry.lastWasCorrect =
              true;


            conceptEntry.lastVerified =
              Date.now();


            conceptEntry.accuracy =
              Math.round(
                (
                  conceptEntry.correct /
                  Math.max(
                    1,
                    conceptEntry.attempts
                  )
                ) * 100
              );


            conceptEntry.confidence =
              Math.min(
                100,
                Math.round(
                  conceptEntry.attempts *
                  12
                )
              );


            conceptEntry.decayFlag =
              false;


            conceptEntry.mastery =
              Math.min(
                100,
                conceptEntry.mastery + 4
              );


            conceptEntry.skills.concepts =
              Math.min(
                100,
                conceptEntry.skills.concepts + 4
              );


            conceptEntry.recommendedAction =
              conceptEntry.mastery < 75
                ? 'PRACTICE'
                : 'MAINTAIN';


          } else if (
            q.isCorrect === false
          ) {

            conceptEntry.wrongCount =
              (
                Number(
                  conceptEntry.wrongCount
                ) || 0
              ) + 1;


            conceptEntry.lastWrongQuestion =
              String(
                q.question ||
                ''
              ).trim();


            conceptEntry.lastWasCorrect =
              false;


            conceptEntry.accuracy =
              Math.round(
                (
                  conceptEntry.correct /
                  Math.max(
                    1,
                    conceptEntry.attempts
                  )
                ) * 100
              );


            conceptEntry.confidence =
              Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    conceptEntry.attempts *
                    12 -
                    conceptEntry.wrongCount *
                    8
                  )
                )
              );


            conceptEntry.recommendedAction =
              '2_MIN_FIX';


            conceptEntry.mastery =
              Math.max(
                10,
                conceptEntry.mastery - 3
              );


            conceptEntry.skills.concepts =
              Math.max(
                10,
                conceptEntry.skills.concepts - 3
              );
          }


          conceptEntry.lastPracticed =
            Date.now();


          /*
             Store broader topic/chapter relationship.
          */

          if (topic) {

            conceptEntry.parentTopic =
              topic;
          }

        }
      );
    }


    updateMistakeRecovery({
      subject,
      topic,
      fixedCount
    }) {

      const safeSubject =
        String(
          subject ||
          'General'
        ).trim() ||
        'General';


      const safeTopic =
        String(
          topic ||
          'General'
        ).trim() ||
        'General';


      const entry =
        this.getTopicEntry(
          safeSubject,
          safeTopic
        );


      /*
         Successful 2-Minute Fix is stronger
         evidence than merely asking a doubt.
      */

      const boost =
        Math.min(
          12,
          Math.max(
            6,
            Number(fixedCount) ||
            1
          ) * 6
        );


      entry.mastery =
        Math.min(
          100,
          entry.mastery + boost
        );


      entry.skills.concepts =
        Math.min(
          100,
          entry.skills.concepts + 8
        );


      /*
         Successful mistake recovery is
         strong evidence of conceptual repair.
      */

      entry.lastVerified =
        Date.now();


      entry.lastPracticed =
        Date.now();


      entry.decayFlag =
        false;


      entry.confidence =
        Math.min(
          100,
          Math.max(
            Number(
              entry.confidence
            ) || 0,
            60
          ) + 10
        );


      entry.recommendedAction =
        entry.mastery < 75
          ? 'PRACTICE'
          : 'MAINTAIN';
    }


    updateDoubtMastery({
      subject,
      topic
    }) {

      const safeSubject =
        String(
          subject ||
          'General'
        ).trim() ||
        'General';


      const safeTopic =
        String(
          topic ||
          'General'
        ).trim() ||
        'General';


      const entry =
        this.getTopicEntry(
          safeSubject,
          safeTopic
        );


      /*
         Asking a doubt proves engagement,
         NOT mastery.
      */

      entry.lastPracticed =
        Date.now();


      entry.doubtCount =
        (
          Number(
            entry.doubtCount
          ) || 0
        ) + 1;


      entry.recommendedAction =
        'UNDERSTAND';
    }


    updateTwoMinFixMastery({
      subject,
      topic
    }) {

      const entry =
        this.getTopicEntry(
          subject,
          topic
        );


      /*
         Completing a Fix is an intervention,
         not proof of mastery.

         Mastery increases only after
         MISTAKE_RECOVERED.
      */

      entry.lastPracticed =
        Date.now();
    }


    updateMastery(
      topic,
      delta = 1,
      subject = 'General'
    ) {

      const safeTopic =
        String(
          topic ||
          'General'
        ).trim() ||
        'General';


      const safeDelta =
        Number.isFinite(
          Number(delta)
        )
          ? Number(delta)
          : 0;


      const entry =
        this.getTopicEntry(
          subject,
          safeTopic
        );


      entry.mastery =
        Math.max(
          0,
          Math.min(
            100,
            entry.mastery +
            safeDelta
          )
        );


      entry.lastPracticed =
        Date.now();


      this.saveMastery();


      return entry.mastery;
    }


    getTopicEntry(
      subject = 'Science',
      topic = 'General'
    ) {

      const subKey =
        String(
          subject ||
          'General'
        ).trim() ||
        'General';


      const topKey =
        String(
          topic ||
          'General'
        ).trim() ||
        'General';


      if (
        !this.mastery[subKey]
      ) {

        this.mastery[subKey] = {};
      }


      if (
        !this.mastery[subKey][topKey]
      ) {

        this.mastery[subKey][topKey] = {

          mastery:
            50,

          accuracy:
            50,

          attempts:
            0,

          correct:
            0,

          wrongCount:
            0,

          confidence:
            0,

          lastQuestion:
            '',

          lastWrongQuestion:
            '',

          lastWasCorrect:
            null,

          lastPracticed:
            Date.now(),

          lastVerified:
            null,

          parentTopic:
            '',

          isConcept:
            false,

          doubtCount:
            0,

          decayFlag:
            false,

          recommendedAction:
            'PRACTICE',

          skills: {
            ...DEFAULT_SKILLS
          }
        };
      }


      /*
         --------------------------------------------------
         BACKWARD COMPATIBILITY
      --------------------------------------------------
      */

      const entry =
        this.mastery[subKey][topKey];


      if (
        typeof entry.accuracy !== 'number'
      ) {

        const attempts =
          Number(
            entry.attempts
          ) || 0;


        const correct =
          Number(
            entry.correct
          ) || 0;


        entry.accuracy =
          attempts > 0
            ? Math.round(
                (
                  correct /
                  attempts
                ) * 100
              )
            : 50;
      }


      if (
        typeof entry.wrongCount !== 'number'
      ) {

        entry.wrongCount =
          0;
      }


      if (
        typeof entry.confidence !== 'number'
      ) {

        entry.confidence =
          Math.min(
            100,
            (
              Number(
                entry.attempts
              ) || 0
            ) * 10
          );
      }


      if (
        typeof entry.doubtCount !== 'number'
      ) {

        entry.doubtCount =
          0;
      }


      if (
        typeof entry.isConcept !== 'boolean'
      ) {

        entry.isConcept =
          false;
      }


      if (
        typeof entry.decayFlag !== 'boolean'
      ) {

        entry.decayFlag =
          false;
      }


      if (
        typeof entry.recommendedAction !== 'string'
      ) {

        entry.recommendedAction =
          'PRACTICE';
      }


      if (
        !entry.skills ||
        typeof entry.skills !== 'object'
      ) {

        entry.skills = {
          ...DEFAULT_SKILLS
        };

      } else {

        Object.keys(
          DEFAULT_SKILLS
        ).forEach(
          skill => {

            if (
              typeof entry.skills[skill] !== 'number'
            ) {

              entry.skills[skill] =
                DEFAULT_SKILLS[skill];
            }

          }
        );
      }


      return entry;
    }


    /* --------------------------------------------------
       3. SPACED REPETITION & KNOWLEDGE DECAY
    -------------------------------------------------- */

    initDecayEngine() {

      const now =
        Date.now();


      const FIVE_DAYS =
        5 *
        24 *
        60 *
        60 *
        1000;


      let decayOccurred =
        false;


      Object.keys(
        this.mastery
      ).forEach(
        sub => {

          Object.keys(
            this.mastery[sub]
          ).forEach(
            top => {

              const item =
                this.mastery[sub][top];


              if (!item) {
                return;
              }


              const daysInactive =
                (
                  now -
                  (
                    Number(
                      item.lastPracticed
                    ) ||
                    now
                  )
                ) /
                FIVE_DAYS;


              if (
                daysInactive >= 1 &&
                item.mastery > 20
              ) {

                const decayAmount =
                  Math.min(
                    15,
                    Math.floor(
                      daysInactive * 3
                    )
                  );


                item.mastery =
                  Math.max(
                    20,
                    item.mastery -
                    decayAmount
                  );


                item.decayFlag =
                  true;


                item.recommendedAction =
                  'REFRESH';


                decayOccurred =
                  true;
              }

            }
          );

        }
      );


      if (
        decayOccurred
      ) {

        this.saveMastery();
      }
    }


    /* --------------------------------------------------
       4. INTELLIGENT "NEXT BEST MOVE"
    -------------------------------------------------- */

    getNextBestMove() {

      let targetMove =
        null;


      let weakestScore =
        Infinity;


      /* =================================================
         1. PRIORITIZE REAL TEST-DERIVED CONCEPTS
      ================================================= */

      Object.keys(
        this.mastery
      ).forEach(
        sub => {

          Object.keys(
            this.mastery[sub]
          ).forEach(
            top => {

              const item =
                this.mastery[sub][top];


              if (
                !item ||
                item.isConcept !== true ||
                Number(item.attempts) <= 0
              ) {

                return;
              }


              const attempts =
                Number(
                  item.attempts
                ) || 0;


              const correct =
                Number(
                  item.correct
                ) || 0;


              const wrongCount =
                Number(
                  item.wrongCount
                ) || 0;


              const accuracy =
                attempts > 0
                  ? (
                      correct /
                      attempts
                    ) * 100
                  : 50;


              const weaknessScore =
                accuracy -
                Math.min(
                  20,
                  wrongCount * 5
                );


              if (
                weaknessScore <
                weakestScore
              ) {

                weakestScore =
                  weaknessScore;


                targetMove = {

                  type:
                    'MASTERY_RECOVERY',

                  subject:
                    sub,

                  topic:
                    top,

                  parentTopic:
                    item.parentTopic ||
                    '',

                  mastery:
                    Number(
                      item.mastery
                    ) || 50,

                  accuracy:
                    Math.round(
                      accuracy
                    ),

                  wrongCount:
                    wrongCount,

                  originalQuestion:
                    item.lastWrongQuestion ||
                    item.lastQuestion ||
                    '',

                  coreMisconception:
                    wrongCount > 0

                      ? `The student is struggling with ${top}. The concept was missed in a recent assessment question.`

                      : `The student needs additional practice with ${top}.`,

                  reason:
                    wrongCount > 0

                      ? `You missed ${wrongCount} question${wrongCount === 1 ? '' : 's'} related to ${top}.`

                      : `Your current performance in ${top} needs reinforcement.`,

                  actionTitle:
                    'Launch 2-Min Fix',

                  actionTab:
                    'fix'
                };
              }

            }
          );

        }
      );


      /* =================================================
         2. FALLBACK TO EXISTING MASTERY / DECAY LOGIC
      ================================================= */

      if (
        !targetMove
      ) {

        let lowestMastery =
          101;


        Object.keys(
          this.mastery
        ).forEach(
          sub => {

            Object.keys(
              this.mastery[sub]
            ).forEach(
              top => {

                const item =
                  this.mastery[sub][top];


                if (
                  item &&
                  item.mastery <
                  lowestMastery
                ) {

                  lowestMastery =
                    item.mastery;


                  targetMove = {

                    type:
                      'MASTERY_RECOVERY',

                    subject:
                      sub,

                    topic:
                      top,

                    mastery:
                      item.mastery,

                    reason:
                      item.decayFlag

                        ? `You haven't practiced ${top} in 5+ days. Memory retention is decaying.`

                        : `Your mastery in ${top} is low at ${item.mastery}%.`,

                    actionTitle:
                      item.mastery < 65

                        ? 'Launch 2-Min Fix'

                        : `Master ${top}`,

                    actionTab:
                      item.mastery < 65

                        ? 'fix'

                        : 'reels'
                  };
                }

              }
            );

          }
        );
      }


      /* =================================================
         3. FINAL FALLBACK
      ================================================= */

      if (
        !targetMove
      ) {

        targetMove = {

          type:
            'DAILY_CHALLENGE',

          subject:
            'Science',

          topic:
            'Blitz Challenge',

          mastery:
            85,

          reason:
            'All concepts are stable. Complete a High-Speed Blitz to maintain your leaderboard rank.',

          actionTitle:
            'Launch 60s Blitz',

          actionTab:
            'arena'
        };
      }


      return targetMove;
    }


    /* --------------------------------------------------
       5. SUPABASE CLOUD SYNC ENGINE
    -------------------------------------------------- */


    async getAuthenticatedStudentId() {

      try {

        if (
          !window.supabase ||
          !window.supabase.auth
        ) {

          return null;
        }


        const {
          data,
          error
        } =
          await window.supabase
            .auth
            .getSession();


        if (
          error ||
          !data ||
          !data.session ||
          !data.session.user
        ) {

          return null;
        }


        return (
          data.session.user.id ||
          null
        );

      } catch(e) {

        console.warn(
          '[Telemetry] Could not resolve authenticated student:',
          e
        );


        return null;
      }
    }


    async createStableConceptId(
      identity
    ) {

      /*
         ---------------------------------------------------
         STABLE CLOUD CONCEPT IDENTITY

         Same:

           student
           +
           subject
           +
           chapter
           +
           concept

         always produces the same UUID.

         This allows concept_mastery to use its
         existing UUID primary key without requiring
         a composite unique constraint.
      ---------------------------------------------------
      */

      const text =
        String(
          identity ||
          ''
        )
          .trim()
          .toLowerCase();


      if (
        window.crypto &&
        window.crypto.subtle &&
        window.TextEncoder
      ) {

        try {

          const data =
            new TextEncoder()
              .encode(
                text
              );


          const hashBuffer =
            await window.crypto.subtle.digest(
              'SHA-256',
              data
            );


          const hashArray =
            Array.from(
              new Uint8Array(
                hashBuffer
              )
            );


          let hex =
            hashArray
              .map(
                byte =>
                  byte
                    .toString(16)
                    .padStart(
                      2,
                      '0'
                    )
              )
              .join('');


          /*
             First 32 hex characters
             become the UUID body.
          */

          hex =
            hex.substring(
              0,
              32
            );


          /*
             UUID version 5 marker.
          */

          hex =
            hex.substring(
              0,
              12
            ) +
            '5' +
            hex.substring(
              13
            );


          /*
             RFC-compatible variant marker.
          */

          const variant =
            parseInt(
              hex.substring(
                16,
                18
              ),
              16
            );


          const variantHex =
            (
              (variant & 0x3f) |
              0x80
            )
              .toString(16)
              .padStart(
                2,
                '0'
              );


          hex =
            hex.substring(
              0,
              16
            ) +
            variantHex +
            hex.substring(
              18
            );


          return (

            hex.substring(
              0,
              8
            ) +

            '-' +

            hex.substring(
              8,
              12
            ) +

            '-' +

            hex.substring(
              12,
              16
            ) +

            '-' +

            hex.substring(
              16,
              20
            ) +

            '-' +

            hex.substring(
              20,
              32
            )

          );

        } catch(e) {

          console.warn(
            '[Telemetry] Stable concept ID generation failed:',
            e
          );
        }
      }


      /*
         Fallback for environments without
         Web Crypto.
      */

      let hash =
        2166136261;


      for (
        let i = 0;
        i < text.length;
        i++
      ) {

        hash ^=
          text.charCodeAt(
            i
          );


        hash =
          Math.imul(
            hash,
            16777619
          );
      }


      const h =
        (
          hash >>> 0
        )
          .toString(16)
          .padStart(
            8,
            '0'
          );


      const base =
        (
          h +
          h +
          h +
          h
        )
          .substring(
            0,
            32
          );


      return (

        base.substring(
          0,
          8
        ) +

        '-' +

        base.substring(
          8,
          12
        ) +

        '-5' +

        base.substring(
          13,
          16
        ) +

        '-8' +

        base.substring(
          17,
          20
        ) +

        '-' +

        base.substring(
          20,
          32
        )

      );
    }


    async flushQueueToSupabase() {

      /*
         ---------------------------------------------------
         CLOUD SYNC
         ---------------------------------------------------

         Synchronizes:

         1. learning_events
         2. concept_mastery
      ---------------------------------------------------
      */


      if (
        !window.supabase
      ) {

        return;
      }


      /*
         Resolve the REAL authenticated student.

         Never use a mock UUID.
      */

      const studentId =
        await this.getAuthenticatedStudentId();


      if (!studentId) {

        console.warn(
          '[Telemetry] Cloud sync skipped: no authenticated student.'
        );

        return;
      }


      /* ==================================================
         1. LEARNING EVENTS
      ================================================== */

      if (
        this.syncQueue.length > 0
      ) {

        const eventsToSend =
          [
            ...this.syncQueue
          ];


        const eventPayloads =
          eventsToSend.map(
            e => {

              const p =
                e.payload ||
                {};


              return {

                student_id:
                  studentId,

                event_type:
                  e.type,

                subject:
                  p.subject ||
                  'General',

                chapter:
                  p.chapter ||
                  p.parentTopic ||
                  'General',

                concept:
                  p.concept ||
                  p.topic ||
                  'General',

                score:
                  Number(
                    p.percentage ??
                    p.accuracy ??
                    p.score ??
                    0
                  ),

                metadata: {

                  canonical: {

                    studentId:
                      studentId,

                    subject:
                      p.subject ||
                      'General',

                    chapter:
                      p.chapter ||
                      p.parentTopic ||
                      '',

                    topic:
                      p.topic ||
                      '',

                    concept:
                      p.concept ||
                      '',

                    question:
                      p.question ||
                      p.originalQuestion ||
                      '',

                    source:
                      p.source ||
                      'system',

                    result:
                      p.result ||
                      '',

                    eventVersion:
                      p.eventVersion ||
                      1
                  },

                  original:
                    p
                },

                created_at:
                  new Date(
                    e.timestamp
                  ).toISOString()
              };
            }
          );


        try {

          const {
            error: eventError
          } =
            await window.supabase
              .from(
                'learning_events'
              )
              .insert(
                eventPayloads
              );


          if (
            eventError
          ) {

            console.error(
              '[Telemetry] Learning event cloud sync failed:',
              eventError
            );

          } else {

            /*
               Only clear after successful
               insertion.
            */

            this.syncQueue = [];
          }

        } catch(err) {

          console.error(
            '[Telemetry] Learning event sync exception:',
            err
          );

          return;
        }
      }


      /* ==================================================
         2. CONCEPT MASTERY
      ================================================== */

      const masteryPayloads =
        [];


      Object.keys(
        this.mastery
      ).forEach(
        subject => {

          const subjectData =
            this.mastery[
              subject
            ];


          if (
            !subjectData ||
            typeof subjectData !== 'object'
          ) {

            return;
          }


          Object.keys(
            subjectData
          ).forEach(
            conceptKey => {

              const c =
                subjectData[
                  conceptKey
                ];


              if (
                !c ||
                typeof c !== 'object'
              ) {

                return;
              }


              const concept =
                String(
                  conceptKey ||
                  'General'
                )
                  .trim() ||
                  'General';


              /*
                 For real concept entries:

                   chapter = parentTopic
                   concept = concept key

                 For older chapter-level entries:

                   chapter = concept key
                   concept = concept key
              */

              const chapter =
                String(

                  c.isConcept

                    ? (
                        c.parentTopic ||
                        concept
                      )

                    : concept

                )
                  .trim() ||
                  'General';


              const safeSubject =
                String(
                  subject ||
                  'General'
                )
                  .trim() ||
                  'General';


              /*
                 Stable identity.

                 Same student + subject +
                 chapter + concept always
                 receives the same UUID.
              */

              const identity =
                [
                  studentId,
                  safeSubject,
                  chapter,
                  concept
                ]
                  .join(
                    '::'
                  );


              masteryPayloads.push({

                id:
                  null,

                student_id:
                  studentId,

                subject:
                  safeSubject,

                chapter:
                  chapter,

                concept:
                  concept,

                mastery_level:
                  Number(
                    c.mastery
                  ) || 0,

                times_practiced:
                  Number(
                    c.attempts
                  ) || 0,

                last_practiced:

                  c.lastPracticed

                    ? new Date(
                        c.lastPracticed
                      ).toISOString()

                    : new Date()
                        .toISOString(),

                __identity:
                  identity
              });

            }
          );

        }
      );


      /*
         Generate stable UUIDs.
      */

      for (
        const item
        of masteryPayloads
      ) {

        item.id =
          await this.createStableConceptId(
            item.__identity
          );


        delete item.__identity;
      }


      /*
         IMPORTANT:

         We use the existing UUID primary key.

         We do NOT use:

           onConflict:
           'student_id, concept'

         because the current Supabase schema
         does not establish that composite
         uniqueness.
      */

      if (
        masteryPayloads.length > 0
      ) {

        try {

          const {
            error: masteryError
          } =
            await window.supabase
              .from(
                'concept_mastery'
              )
              .upsert(
                masteryPayloads,
                {
                  onConflict:
                    'id'
                }
              );


          if (
            masteryError
          ) {

            console.error(
              '[Telemetry] Concept mastery cloud sync failed:',
              masteryError
            );

          } else {

            console.log(
              '[Telemetry] Concept mastery synced:',
              masteryPayloads.length
            );
          }

        } catch(err) {

          console.error(
            '[Telemetry] Concept mastery sync exception:',
            err
          );
        }
      }
    }


    /* --------------------------------------------------
       6. PERSISTENCE HELPERS
    -------------------------------------------------- */

    loadMastery() {

      try {

        const saved =
          localStorage.getItem(
            STORAGE_KEY_MASTERY
          );


        return saved
          ? JSON.parse(
              saved
            )
          : {};

      } catch(e) {

        return {};
      }
    }


    saveMastery() {

      try {

        localStorage.setItem(
          STORAGE_KEY_MASTERY,
          JSON.stringify(
            this.mastery
          )
        );

      } catch(e) {}
    }


    loadEvents() {

      try {

        const saved =
          localStorage.getItem(
            STORAGE_KEY_EVENTS
          );


        return saved
          ? JSON.parse(
              saved
            )
          : [];

      } catch(e) {

        return [];
      }
    }

  }


  /* --------------------------------------------------
     GLOBAL SINGLETON
  -------------------------------------------------- */

  window.InvincibleTelemetry =
    new TelemetryEngine();

})(window);


/* =====================================================
   DASHBOARD INTELLIGENCE & NEXT BEST MOVE SYNC
===================================================== */

let currentNextAction = {
  tab:
    'reels',

  topic:
    'General'
};


window.renderNextBestMove =
  function() {

    if (
      !window.InvincibleTelemetry
    ) {

      return;
    }


    const nbm =
      window.InvincibleTelemetry
        .getNextBestMove();


    if (!nbm) {
      return;
    }


    const titleEl =
      document.getElementById(
        'nbmTitle'
      );


    const reasonEl =
      document.getElementById(
        'nbmReason'
      );


    const badgeEl =
      document.getElementById(
        'nbmMasteryBadge'
      );


    const tagEl =
      document.getElementById(
        'nbmTag'
      );


    const btnEl =
      document.getElementById(
        'nbmActionBtn'
      );


    if (titleEl) {

      titleEl.innerText =
        `${nbm.subject}: ${nbm.topic}`;
    }


    if (reasonEl) {

      reasonEl.innerText =
        nbm.reason;
    }


    if (badgeEl) {

      badgeEl.innerText =
        `${nbm.mastery}% MASTERY`;
    }


    if (tagEl) {

      if (
        nbm.type ===
        'MASTERY_RECOVERY'
      ) {

        tagEl.innerText =
          'WEAK SPOT';

        tagEl.style.color =
          'var(--accent-rose)';

        tagEl.style.borderColor =
          'var(--accent-rose)';

        tagEl.style.background =
          'rgba(244,63,94,0.15)';

      } else {

        tagEl.innerText =
          'HIGH YIELD';

        tagEl.style.color =
          'var(--accent-cyan)';

        tagEl.style.borderColor =
          'var(--accent-cyan)';

        tagEl.style.background =
          'rgba(0,229,255,0.15)';
      }
    }


    if (btnEl) {

      btnEl.innerText =
        `${nbm.actionTitle.toUpperCase()} 🚀`;
    }


    currentNextAction = {

      tab:
        nbm.actionTab ||
        'reels',

      subject:
        nbm.subject ||
        'General',

      topic:
        nbm.topic ||
        'General',

      reason:
        nbm.reason ||
        '',

      originalQuestion:
        nbm.originalQuestion ||
        '',

      mistakeId:
        nbm.mistakeId ||
        null
    };
  };


window.executeNextBestMove =
  function() {

    if (
      !window.InvincibleTelemetry
    ) {

      return;
    }


    /*
       Weak concept launches the actual
       2-Minute Fix event.
    */

    if (
      currentNextAction.tab ===
      'fix'
    ) {

      window.InvincibleTelemetry.emit(

        '2_MIN_FIX_REQUESTED',

        {

          subject:
            currentNextAction.subject ||
            'General',

          topic:
            currentNextAction.topic ||
            'General',

          originalQuestion:
            currentNextAction.originalQuestion ||
            '',

          coreMisconception:
            currentNextAction.reason ||
            '',

          mistakeId:
            currentNextAction.mistakeId ||
            null
        }

      );

      return;
    }


    /*
       Normal Next Best Move navigation.
    */

    if (
      typeof switchTab ===
      'function'
    ) {

      switchTab(
        currentNextAction.tab
      );
    }
  };


/* --------------------------------------------------
   RE-EVALUATE WHEN PAGE LOADS
-------------------------------------------------- */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    setTimeout(
      window.renderNextBestMove,
      200
    );
  }
);


/* --------------------------------------------------
   RE-EVALUATE AFTER LEARNING EVENTS
-------------------------------------------------- */

window.addEventListener(
  'invincible:event',
  () => {

    setTimeout(
      window.renderNextBestMove,
      150
    );
  }
);