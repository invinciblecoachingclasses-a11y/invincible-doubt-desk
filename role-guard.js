/* ============================================================
   INVINCIBLE 360 — ROLE GUARD
   Student / Teacher / Admin role boundary

   IMPORTANT:
   This is a CLIENT-SIDE navigation/UI guard.
   Supabase RLS/backend authorization remains the real
   security boundary for protected data.
============================================================ */

(function () {
  'use strict';

  const SUPABASE_URL =
    'https://cbgwbzidkmcefoithipp.supabase.co';

  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZ3diemlka21jZWZvaXRoaXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgyNTQsImV4cCI6MjEwMTc4NDI1NH0.gJq3-0tU-8fxdF0Y_1_qcet_VYp7gysv5yWfl_o8T0g';

  const ROLE_KEY = 'invincible_user_role';

  /*
     This flag is used only for legacy teacher accounts that were
     created before role metadata was introduced.

     It is set by login.html only after successful authentication
     through the dedicated Faculty Login.
  */
  const LEGACY_TEACHER_KEY =
    'invincible_legacy_teacher_session';

  const ROLE_CONFIG = {
    student: {
      home: 'app.html'
    },

    teacher: {
      home: 'test-maker.html'
    },

    admin: {
      home: 'test-maker.html'
    }
  };

  function getSupabaseClient() {
    if (window.supabaseClient) {
      return window.supabaseClient;
    }

    if (
      window.supabase &&
      typeof window.supabase.createClient === 'function'
    ) {
      window.supabaseClient =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        );

      return window.supabaseClient;
    }

    return null;
  }

  function getStoredRole() {
    try {
      return localStorage.getItem(ROLE_KEY);
    } catch (e) {
      return null;
    }
  }

  function storeRole(role) {
    try {
      localStorage.setItem(ROLE_KEY, role);
    } catch (e) {}
  }

  function clearStoredRole() {
    try {
      localStorage.removeItem(ROLE_KEY);
    } catch (e) {}
  }

  function hasLegacyTeacherSession() {
    try {
      return (
        sessionStorage.getItem(LEGACY_TEACHER_KEY) === 'true'
      );
    } catch (e) {
      return false;
    }
  }

  function setLegacyTeacherSession() {
    try {
      sessionStorage.setItem(
        LEGACY_TEACHER_KEY,
        'true'
      );
    } catch (e) {}
  }

  function clearLegacyTeacherSession() {
    try {
      sessionStorage.removeItem(
        LEGACY_TEACHER_KEY
      );
    } catch (e) {}
  }

  function normalizeRole(role) {
    const value =
      String(role || '')
        .trim()
        .toLowerCase();

    if (value === 'teacher') return 'teacher';
    if (value === 'admin') return 'admin';
    if (value === 'student') return 'student';

    return null;
  }

  async function getCurrentUser() {
    const sb = getSupabaseClient();

    if (!sb || !sb.auth) {
      return null;
    }

    try {
      const {
        data,
        error
      } = await sb.auth.getSession();

      if (
        error ||
        !data ||
        !data.session ||
        !data.session.user
      ) {
        return null;
      }

      return data.session.user;

    } catch (error) {
      console.warn(
        '[RoleGuard] Could not read Supabase session:',
        error
      );

      return null;
    }
  }

  async function getCurrentRole() {
    const user = await getCurrentUser();

    if (!user) {
      clearStoredRole();
      clearLegacyTeacherSession();
      return null;
    }

    const metadata =
      user.user_metadata || {};

    /*
       PRIMARY ROLE SOURCE
       New accounts use explicit Supabase metadata.
    */
    const role =
      normalizeRole(
        metadata.role
      );

    if (role) {
      storeRole(role);

      /*
         If Supabase explicitly says student/admin,
         never allow the legacy teacher fallback.
      */
      if (role !== 'teacher') {
        clearLegacyTeacherSession();
      }

      return role;
    }

    /*
       LEGACY TEACHER FALLBACK

       Existing teachers created before role metadata was
       introduced are allowed when they authenticated through
       the dedicated Faculty Login in the current session.
    */
    if (hasLegacyTeacherSession()) {
      storeRole('teacher');
      return 'teacher';
    }

    return null;
  }

  function redirectTo(path) {
    if (
      window.location.pathname.endsWith(path)
    ) {
      return;
    }

    window.location.href = path;
  }

  async function requireRole(allowedRoles) {
    const roles =
      Array.isArray(allowedRoles)
        ? allowedRoles
            .map(normalizeRole)
            .filter(Boolean)
        : [
            normalizeRole(allowedRoles)
          ].filter(Boolean);

    const role =
      await getCurrentRole();

    if (!role) {
      redirectTo('index.html');
      return false;
    }

    if (!roles.includes(role)) {
      const destination =
        ROLE_CONFIG[role]?.home ||
        'index.html';

      redirectTo(destination);
      return false;
    }

    return true;
  }

  async function requireTeacher() {
    return requireRole(['teacher']);
  }

  async function requireStudent() {
    return requireRole(['student']);
  }

  async function requireAdmin() {
    return requireRole(['admin']);
  }

  async function getRole() {
    return getCurrentRole();
  }

  function isTeacher(role) {
    return normalizeRole(role) === 'teacher';
  }

  function isStudent(role) {
    return normalizeRole(role) === 'student';
  }

  function isAdmin(role) {
    return normalizeRole(role) === 'admin';
  }

  /*
     Expose public API
  */
  window.InvincibleRoleGuard = {
    getRole,
    getCurrentUser,
    requireRole,
    requireTeacher,
    requireStudent,
    requireAdmin,
    isTeacher,
    isStudent,
    isAdmin,
    normalizeRole,

    /*
       Used by the dedicated Faculty Login after
       successful authentication.
    */
    setLegacyTeacherSession
  };

  /*
     Keep role state synchronized with Supabase auth.
  */
  const sb = getSupabaseClient();

  if (
    sb &&
    sb.auth &&
    typeof sb.auth.onAuthStateChange === 'function'
  ) {
    sb.auth.onAuthStateChange(
      function (event, session) {

        if (
          session &&
          session.user
        ) {
          const role =
            normalizeRole(
              session.user.user_metadata?.role
            );

          if (role) {
            storeRole(role);

            if (role !== 'teacher') {
              clearLegacyTeacherSession();
            }
          }

        } else if (
          event === 'SIGNED_OUT'
        ) {
          clearStoredRole();
          clearLegacyTeacherSession();
        }
      }
    );
  }

})();