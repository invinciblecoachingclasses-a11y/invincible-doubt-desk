/* ============================================================
   INVINCIBLE 360 — STUDENT IDENTITY ENGINE

   Purpose:
   Give every student a Supabase-authenticated UUID without
   forcing the student to manually log in.

   Flow:

   Existing authenticated user
        ↓
   keep existing session

   No session
        ↓
   Supabase Anonymous Sign-In
        ↓
   authenticated UUID
        ↓
   learning_events / mastery / evidence can sync safely

   IMPORTANT:
   This module does NOT modify engine_telemetry.js.
============================================================ */

(function (window) {
  'use strict';

  const IDENTITY_KEY =
    'invincible_student_identity_id';

  const IDENTITY_TYPE_KEY =
    'invincible_student_identity_type';

  let identityPromise = null;


  /* ------------------------------------------------------------
     Get the actual Supabase client
  ------------------------------------------------------------ */

  function getClient() {

    if (
      window.InvincibleSupabase &&
      typeof window.InvincibleSupabase.getClient === 'function'
    ) {
      return window.InvincibleSupabase.getClient();
    }

    if (window.supabaseClient) {
      return window.supabaseClient;
    }

    return null;
  }


  /* ------------------------------------------------------------
     Save identity locally for diagnostics / continuity
  ------------------------------------------------------------ */

  function rememberIdentity(user) {

    if (!user || !user.id) {
      return;
    }

    try {

      localStorage.setItem(
        IDENTITY_KEY,
        user.id
      );

      localStorage.setItem(
        IDENTITY_TYPE_KEY,
        user.is_anonymous === true
          ? 'anonymous'
          : 'authenticated'
      );

    } catch (error) {

      console.warn(
        '[Student Identity] Could not save local identity:',
        error
      );
    }
  }


  /* ------------------------------------------------------------
     Get existing Supabase session
  ------------------------------------------------------------ */

  async function getExistingSession(client) {

    try {

      const {
        data,
        error
      } = await client.auth.getSession();

      if (error) {
        console.warn(
          '[Student Identity] Session check failed:',
          error
        );

        return null;
      }

      if (
        data &&
        data.session &&
        data.session.user
      ) {

        rememberIdentity(
          data.session.user
        );

        return data.session;
      }

    } catch (error) {

      console.warn(
        '[Student Identity] Session lookup failed:',
        error
      );
    }

    return null;
  }


  /* ------------------------------------------------------------
     Create anonymous student identity
  ------------------------------------------------------------ */

  async function createAnonymousIdentity(client) {

    console.log(
      '[Student Identity] No authenticated session found.'
    );

    console.log(
      '[Student Identity] Creating anonymous student identity...'
    );

    const {
      data,
      error
    } = await client.auth.signInAnonymously({

      options: {

        data: {

          role: 'student',

          identity_type:
            'anonymous_student',

          platform:
            'invincible_360'

        }

      }

    });


    if (error) {

      console.error(
        '[Student Identity] Anonymous sign-in failed:',
        error
      );

      throw error;
    }


    if (
      !data ||
      !data.user ||
      !data.session
    ) {

      throw new Error(
        'Supabase did not return an anonymous student session.'
      );
    }


    rememberIdentity(
      data.user
    );


    console.log(
      '[Student Identity] Anonymous student created:',
      data.user.id
    );


    return data.session;
  }


  /* ------------------------------------------------------------
     Ensure identity exists
  ------------------------------------------------------------ */

  async function ensureIdentity() {

    if (identityPromise) {
      return identityPromise;
    }


    identityPromise = (async function () {

      const client =
        getClient();


      if (!client) {

        throw new Error(
          'Supabase client is not available.'
        );
      }


      /*
         First use an existing permanent or anonymous session.
      */

      const existingSession =
        await getExistingSession(
          client
        );


      if (
        existingSession &&
        existingSession.user
      ) {

        console.log(
          '[Student Identity] Existing session:',
          existingSession.user.id
        );

        return existingSession;
      }


      /*
         No session exists.

         Create an anonymous authenticated student.
      */

      return await createAnonymousIdentity(
        client
      );

    })();


    try {

      const session =
        await identityPromise;


      /*
         Once identity exists, ask telemetry to flush any
         events that were waiting locally.

         This keeps this module independent from the huge
         telemetry engine.
      */

      setTimeout(function () {

        try {

          if (
            window.InvincibleTelemetry &&
            typeof
              window.InvincibleTelemetry
                .flushQueueToSupabase ===
              'function'
          ) {

            window.InvincibleTelemetry
              .flushQueueToSupabase();

          }

        } catch (error) {

          console.warn(
            '[Student Identity] Telemetry flush skipped:',
            error
          );
        }

      }, 100);


      return session;

    } catch (error) {

      identityPromise = null;

      throw error;
    }
  }


  /* ------------------------------------------------------------
     Get current student UUID
  ------------------------------------------------------------ */

  async function getStudentId() {

    const session =
      await ensureIdentity();

    return (
      session &&
      session.user &&
      session.user.id
    ) || null;
  }


  /* ------------------------------------------------------------
     Identity status
  ------------------------------------------------------------ */

  async function getIdentity() {

    const session =
      await ensureIdentity();

    if (
      !session ||
      !session.user
    ) {

      return null;
    }

    return {

      id:
        session.user.id,

      isAnonymous:
        session.user.is_anonymous === true,

      email:
        session.user.email || null,

      user:
        session.user

    };
  }


  /* ------------------------------------------------------------
     Public API
  ------------------------------------------------------------ */

  window.InvincibleStudentIdentity = {

    ensureIdentity,

    getStudentId,

    getIdentity,

    getLocalIdentityId: function () {

      try {

        return localStorage.getItem(
          IDENTITY_KEY
        );

      } catch (error) {

        return null;
      }

    },

    isAnonymous: async function () {

      const identity =
        await getIdentity();

      return !!(
        identity &&
        identity.isAnonymous
      );
    }

  };


  /*
     Start identity creation immediately.

     This happens silently in the background.
     The student does NOT see a login screen.
  */

  ensureIdentity()
    .then(function () {

      console.log(
        '[Student Identity] Ready.'
      );

    })
    .catch(function (error) {

      console.error(
        '[Student Identity] Initialization failed:',
        error
      );

    });


})(window);