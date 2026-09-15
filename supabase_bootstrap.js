/* ============================================================
   INVINCIBLE 360 — SUPABASE CLIENT BOOTSTRAP

   Creates the authenticated Supabase client and exposes the
   client methods required by the existing telemetry engine.

   IMPORTANT:
   window.supabase remains the Supabase SDK namespace.
   window.supabaseClient is the actual client.
============================================================ */

(function (window) {
  'use strict';

  const SUPABASE_URL =
    'https://cbgwbzidkmcefoithipp.supabase.co';

  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZ3diemlka21jZWZvaXRoaXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgyNTQsImV4cCI6MjEwMTc4NDI1NH0.gJq3-0tU-8fxdF0Y_1_qcet_VYp7gysv5yWfl_o8T0g';

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

    /*
       Reuse an existing client if one already exists.
    */
    if (window.supabaseClient) {
      bridgeClient(window.supabaseClient);
      return window.supabaseClient;
    }

    try {

      const client =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        );

      window.supabaseClient = client;

      bridgeClient(client);

      console.log(
        '[Supabase Bootstrap] Client initialized and bridged.'
      );

      return client;

    } catch (error) {

      console.error(
        '[Supabase Bootstrap] Client initialization failed:',
        error
      );

      return null;
    }
  }


  function bridgeClient(client) {

    if (!client) {
      return;
    }

    /*
       IMPORTANT:

       engine_telemetry.js currently expects:

          window.supabase.auth
          window.supabase.from()

       The normal Supabase browser SDK exposes createClient()
       on window.supabase, while the actual authenticated
       client exposes auth/from.

       We therefore attach ONLY these client interfaces to
       the SDK namespace.

       We do NOT replace window.supabase itself.
    */

    if (client.auth) {
      window.supabase.auth =
        client.auth;
    }

    if (typeof client.from === 'function') {

      window.supabase.from =
        client.from.bind(client);
    }

    if (typeof client.rpc === 'function') {

      window.supabase.rpc =
        client.rpc.bind(client);
    }

    if (typeof client.storage !== 'undefined') {

      window.supabase.storage =
        client.storage;
    }
  }


  window.InvincibleSupabase = {

    initialize,

    getClient: function () {

      return (
        window.supabaseClient ||
        initialize()
      );
    },

    bridge: function () {

      if (window.supabaseClient) {
        bridgeClient(
          window.supabaseClient
        );

        return true;
      }

      return false;
    }

  };


  initialize();

})(window);