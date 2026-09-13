/* ============================================================
   INVINCIBLE 360 — SUPABASE CLIENT BOOTSTRAP

   Creates one authenticated Supabase client for the
   student application.

   This is intentionally separate from engine_telemetry.js.
============================================================ */

(function (window) {
  'use strict';

  const SUPABASE_URL =
    'https://cbgwbzidkmcefoithipp.supabase.co';

  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI6ImFub24iLCJpYXQiOjE3ODYyMDgyNTQsImV4cCI6MjEwMTc4NDI1NH0.gJq3-0tU-8fxdF0Y_1_qcet_VYp7gysv5yWfl_o8T0g';

  function initialize() {

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== 'function'
    ) {
      console.error(
        '[Supabase Bootstrap] Supabase JS SDK is not loaded.'
      );
      return null;
    }

    if (window.supabaseClient) {
      return window.supabaseClient;
    }

    try {

      window.supabaseClient =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        );

      console.log(
        '[Supabase Bootstrap] Client initialized.'
      );

      return window.supabaseClient;

    } catch (error) {

      console.error(
        '[Supabase Bootstrap] Client initialization failed:',
        error
      );

      return null;
    }
  }

  window.InvincibleSupabase = {
    initialize,
    getClient: function () {
      return window.supabaseClient || initialize();
    }
  };

  initialize();

})(window);