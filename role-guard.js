/* ============================================================
   INVINCIBLE 360 — ROLE GUARD
   Central client-side role boundary for Student / Teacher / Admin

   IMPORTANT:
   This is a UI/navigation guard.
   Supabase RLS/backend authorization must remain the real
   security boundary for protected data.
============================================================ */

(function () {
  'use strict';

  const SUPABASE_URL =
    'https://cbgwbzidkmcefoithipp.supabase.co';

  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmxlIiwicmVmIjoiY2Jn'
    + 'd2J6aWRrTWNlZm9pdGhpcHAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NjIwODI1NCwiZXhwIj'
    + 'oyMTAxNzg0MjU0fQ.gJq3-0tU-8fxdF0Y_1_qcet_VYp7gysv5yWfl_o8T0g';

  const ROLE_KEY = 'invincible_user_role';

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
      return null;
    }

    const metadata =
      user.user_metadata || {};

    const role =
      normalizeRole(
        metadata.role
      );

    if (role) {
      storeRole(role);
      return role;
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
        ? allowedRoles.map(normalizeRole).filter(Boolean)
        : [normalizeRole(allowedRoles)].filter(Boolean);

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
    normalizeRole
  };

  /*
     Keep role state synchronized when Supabase authentication
     changes.
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
          }
        } else if (
          event === 'SIGNED_OUT'
        ) {
          clearStoredRole();
        }
      }
    );
  }

})();