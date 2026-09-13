/* =====================================================
   INVINCIBLE 360 — LEARNING EVIDENCE ENGINE

   Purpose:
   Build an evidence profile for each concept without
   modifying the canonical mastery engine.

   IMPORTANT:
   - Evidence is NOT mastery.
   - Engagement is NOT mastery.
   - This engine observes canonical learning events.
   - Existing engine_telemetry.js remains untouched.
===================================================== */

(function (window) {
  'use strict';

  const STORAGE_KEY =
    'invincible_learning_evidence';

  const VERSION = 1;

  /*
     Evidence weights.

     These values represent relative strength of evidence,
     NOT direct mastery points.
  */

  const EVIDENCE_WEIGHTS = {

    DOUBT_ASKED: 1,

    REEL_RESOLVED: 1,

    DOUBT_SOLVED: 2,

    PRACTICE_STARTED: 1,

    PRACTICE_COMPLETED: 3,

    QUESTION_SOLVED: 3,

    QUESTION_WRONG: 3,

    ARENA_FINISHED: 3,

    LAB_COMPLETED: 4,

    TEST_SUBMITTED: 5,

    MISTAKE_LOGGED: 3,

    MISTAKE_RECOVERED: 6,

    QUESTION_MASTERED: 6,

    TEACHER_HELP_REQUESTED: 1
  };


  class EvidenceEngine {

    constructor() {

      this.version = VERSION;

      this.evidence =
        this.load();

      this.attachEventListener();

      console.log(
        '[EvidenceEngine] Ready'
      );
    }


    /* ==================================================
       STORAGE
    ================================================== */

    load() {

      try {

        const raw =
          localStorage.getItem(
            STORAGE_KEY
          );

        if (!raw) {
          return {};
        }

        const parsed =
          JSON.parse(raw);

        if (
          !parsed ||
          typeof parsed !== 'object'
        ) {
          return {};
        }

        return parsed;

      } catch (error) {

        console.warn(
          '[EvidenceEngine] Could not load evidence:',
          error
        );

        return {};
      }
    }


    save() {

      try {

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            this.evidence
          )
        );

      } catch (error) {

        console.warn(
          '[EvidenceEngine] Could not save evidence:',
          error
        );
      }
    }


    /* ==================================================
       CANONICAL IDENTITY
    ================================================== */

    normalize(value, fallback = '') {

      return String(
        value == null
          ? fallback
          : value
      )
        .trim();
    }


    getIdentity(payload = {}) {

      const subject =
        this.normalize(
          payload.subject,
          'General'
        ) || 'General';


      const chapter =
        this.normalize(
          payload.chapter ||
          payload.parentTopic,
          ''
        );


      const topic =
        this.normalize(
          payload.topic,
          ''
        );


      const concept =
        this.normalize(
          payload.concept,
          ''
        );


      /*
         Concept is preferred.

         If a specific concept is unavailable,
         topic becomes the working learning identity.

         We do NOT invent a fake concept name.
      */

      const conceptKey =
        concept ||
        topic ||
        chapter ||
        'General';


      return {

        subject,

        chapter,

        topic,

        concept,

        conceptKey
      };
    }


    getConceptRecord(
      identity
    ) {

      const subject =
        identity.subject;


      const key =
        identity.conceptKey;


      if (
        !this.evidence[subject]
      ) {

        this.evidence[subject] = {};
      }


      if (
        !this.evidence[subject][key]
      ) {

        this.evidence[subject][key] = {

          version:
            VERSION,

          subject:
            subject,

          chapter:
            identity.chapter ||
            '',

          topic:
            identity.topic ||
            '',

          concept:
            identity.concept ||
            '',

          events:
            0,

          evidenceScore:
            0,

          evidenceBySource: {

            doubt:
              0,

            practice:
              0,

            test:
              0,

            fix:
              0,

            reels:
              0,

            lab:
              0,

            arena:
              0,

            teacherHelp:
              0
          },

          counts: {

            doubtAsked:
              0,

            doubtSolved:
              0,

            practiceStarted:
              0,

            practiceCompleted:
              0,

            questionSolved:
              0,

            questionWrong:
              0,

            testSubmitted:
              0,

            mistakeLogged:
              0,

            mistakeRecovered:
              0,

            questionMastered:
              0,

            reelResolved:
              0,

            labCompleted:
              0,

            arenaFinished:
              0,

            teacherHelpRequested:
              0
          },

          correct:
            0,

          wrong:
            0,

          lastEvent:
            null,

          lastPositiveEvidence:
            null,

          lastNegativeEvidence:
            null,

          lastVerified:
            null
        };
      }


      /*
         Backward compatibility for records created
         before the current structure existed.
      */

      const record =
        this.evidence[subject][key];


      if (
        !record.evidenceBySource
      ) {

        record.evidenceBySource = {};
      }


      if (
        !record.counts
      ) {

        record.counts = {};
      }


      if (
        typeof record.evidenceScore !==
        'number'
      ) {

        record.evidenceScore = 0;
      }


      if (
        typeof record.events !==
        'number'
      ) {

        record.events = 0;
      }


      return record;
    }


    /* ==================================================
       EVENT SOURCE
    ================================================== */

    resolveSource(
      eventType,
      payload = {}
    ) {

      if (
        payload.source
      ) {

        return String(
          payload.source
        )
          .trim()
          .toLowerCase();
      }


      const map = {

        DOUBT_ASKED:
          'doubt',

        DOUBT_SOLVED:
          'doubt',

        FOLLOWUP_ASKED:
          'doubt',

        PRACTICE_STARTED:
          'practice',

        PRACTICE_COMPLETED:
          'practice',

        QUESTION_SOLVED:
          'practice',

        QUESTION_WRONG:
          'practice',

        TEST_SUBMITTED:
          'test',

        MISTAKE_LOGGED:
          'test',

        MISTAKE_RECOVERED:
          'fix',

        '2_MIN_FIX_REQUESTED':
          'fix',

        '2_MIN_FIX_COMPLETED':
          'fix',

        REEL_RESOLVED:
          'reels',

        LAB_COMPLETED:
          'lab',

        ARENA_FINISHED:
          'arena',

        TEACHER_HELP_REQUESTED:
          'teacherHelp'
      };


      return (
        map[eventType] ||
        'system'
      );
    }


    /* ==================================================
       EVENT RESULT
    ================================================== */

    resolveResult(
      eventType,
      payload = {}
    ) {

      if (
        payload.result
      ) {

        return String(
          payload.result
        )
          .trim()
          .toLowerCase();
      }


      if (
        payload.isCorrect === true
      ) {

        return 'correct';
      }


      if (
        payload.isCorrect === false
      ) {

        return 'wrong';
      }


      if (
        eventType ===
        'MISTAKE_RECOVERED'
      ) {

        return 'recovered';
      }


      if (
        eventType ===
        'DOUBT_SOLVED'
      ) {

        return 'solved';
      }


      if (
        eventType ===
        'MISTAKE_LOGGED'
      ) {

        return 'wrong';
      }


      return '';
    }


    /* ==================================================
       EVENT HANDLER
    ================================================== */

    handleEvent(
      eventRecord
    ) {

      if (
        !eventRecord ||
        typeof eventRecord !==
        'object'
      ) {

        return;
      }


      const eventType =
        this.normalize(
          eventRecord.type
        );


      if (!eventType) {
        return;
      }


      const payload =
        eventRecord.payload ||
        {};


      const identity =
        this.getIdentity(
          payload
        );


      const record =
        this.getConceptRecord(
          identity
        );


      const weight =
        Number(
          EVIDENCE_WEIGHTS[
            eventType
          ]
        ) || 0;


      const source =
        this.resolveSource(
          eventType,
          payload
        );


      const result =
        this.resolveResult(
          eventType,
          payload
        );


      const timestamp =
        Number(
          eventRecord.timestamp
        ) ||
        Date.now();


      /* ----------------------------------------------
         Update identity
      ---------------------------------------------- */

      if (
        identity.chapter
      ) {

        record.chapter =
          identity.chapter;
      }


      if (
        identity.topic
      ) {

        record.topic =
          identity.topic;
      }


      if (
        identity.concept
      ) {

        record.concept =
          identity.concept;
      }


      /* ----------------------------------------------
         Evidence event
      ---------------------------------------------- */

      record.events += 1;

      record.evidenceScore +=
        weight;


      if (
        !record.evidenceBySource[source]
      ) {

        record.evidenceBySource[source] =
          0;
      }


      record.evidenceBySource[source] +=
        weight;


      record.lastEvent = {

        type:
          eventType,

        source:
          source,

        result:
          result,

        timestamp:
          timestamp
      };


      /* ----------------------------------------------
         Counters
      ---------------------------------------------- */

      this.updateCounters(
        record,
        eventType
      );


      /* ----------------------------------------------
         Correct / wrong evidence
      ---------------------------------------------- */

      if (
        result ===
        'correct'
      ) {

        record.correct +=
          1;


        record.lastPositiveEvidence =
          timestamp;

      }


      if (
        result ===
        'wrong'
      ) {

        record.wrong +=
          1;


        record.lastNegativeEvidence =
          timestamp;
      }


      /* ----------------------------------------------
         Verification evidence
      ---------------------------------------------- */

      if (
        eventType ===
        'MISTAKE_RECOVERED'
      ) {

        record.lastVerified =
          timestamp;
      }


      if (
        eventType ===
        'QUESTION_MASTERED'
      ) {

        record.lastVerified =
          timestamp;
      }


      this.save();


      /*
         Broadcast a separate evidence event.

         Existing modules do not need to know about
         this engine.
      */

      try {

        window.dispatchEvent(
          new CustomEvent(
            'invincible:evidence',
            {
              detail: {

                version:
                  VERSION,

                eventType:
                  eventType,

                subject:
                  identity.subject,

                chapter:
                  identity.chapter,

                topic:
                  identity.topic,

                concept:
                  identity.concept,

                conceptKey:
                  identity.conceptKey,

                evidenceWeight:
                  weight,

                evidenceSource:
                  source,

                result:
                  result,

                evidenceScore:
                  record.evidenceScore,

                timestamp:
                  timestamp
              }
            }
          )
        );

      } catch (error) {

        console.warn(
          '[EvidenceEngine] Broadcast failed:',
          error
        );
      }
    }


    /* ==================================================
       COUNTERS
    ================================================== */

    updateCounters(
      record,
      eventType
    ) {

      const counterMap = {

        DOUBT_ASKED:
          'doubtAsked',

        DOUBT_SOLVED:
          'doubtSolved',

        PRACTICE_STARTED:
          'practiceStarted',

        PRACTICE_COMPLETED:
          'practiceCompleted',

        QUESTION_SOLVED:
          'questionSolved',

        QUESTION_WRONG:
          'questionWrong',

        TEST_SUBMITTED:
          'testSubmitted',

        MISTAKE_LOGGED:
          'mistakeLogged',

        MISTAKE_RECOVERED:
          'mistakeRecovered',

        QUESTION_MASTERED:
          'questionMastered',

        REEL_RESOLVED:
          'reelResolved',

        LAB_COMPLETED:
          'labCompleted',

        ARENA_FINISHED:
          'arenaFinished',

        TEACHER_HELP_REQUESTED:
          'teacherHelpRequested'
      };


      const key =
        counterMap[eventType];


      if (!key) {
        return;
      }


      if (
        typeof record.counts[key] !==
        'number'
      ) {

        record.counts[key] =
          0;
      }


      record.counts[key] +=
        1;
    }


    /* ==================================================
       EVENT LISTENER
    ================================================== */

    attachEventListener() {

      window.addEventListener(
        'invincible:event',
        event => {

          try {

            const detail =
              event &&
              event.detail;


            if (!detail) {
              return;
            }


            this.handleEvent(
              detail
            );

          } catch (error) {

            console.error(
              '[EvidenceEngine] Event processing failed:',
              error
            );
          }
        }
      );
    }


    /* ==================================================
       PUBLIC API
    ================================================== */

    getEvidence(
      subject,
      concept
    ) {

      const safeSubject =
        this.normalize(
          subject,
          'General'
        ) || 'General';


      const safeConcept =
        this.normalize(
          concept,
          'General'
        ) || 'General';


      return (
        this.evidence[
          safeSubject
        ]?.[
          safeConcept
        ] ||
        null
      );
    }


    getAllEvidence() {

      return (
        JSON.parse(
          JSON.stringify(
            this.evidence
          )
        )
      );
    }


    getEvidenceStrength(
      subject,
      concept
    ) {

      const record =
        this.getEvidence(
          subject,
          concept
        );


      if (!record) {
        return 0;
      }


      return Number(
        record.evidenceScore
      ) || 0;
    }


    getVerificationStatus(
      subject,
      concept
    ) {

      const record =
        this.getEvidence(
          subject,
          concept
        );


      if (!record) {

        return {

          verified:
            false,

          lastVerified:
            null
        };
      }


      return {

        verified:
          Boolean(
            record.lastVerified
          ),

        lastVerified:
          record.lastVerified
      };
    }


    reset() {

      this.evidence =
        {};

      this.save();

      console.log(
        '[EvidenceEngine] Evidence reset.'
      );
    }
  }


  /* ==================================================
     GLOBAL SINGLETON
  ================================================== */

  window.InvincibleEvidence =
    new EvidenceEngine();


})(window);