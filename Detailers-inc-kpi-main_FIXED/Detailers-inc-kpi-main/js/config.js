/* =====================================================================
   Detailers Inc. — configuration
   ---------------------------------------------------------------------
   The two login passwords are HARDCODED HERE, in the JavaScript, exactly
   as the business asked. They are not stored in the data file, not stored
   in Supabase, and not read from any database table.

   To change a password, edit the string and save. No rebuild needed.

   Security note, so nobody is surprised later: anyone who can open these
   files can read these passwords. This is a front-end gate for everyday
   use, not protection against someone determined. Do not treat it as one.
   ===================================================================== */
window.DI_CONFIG = {

  /* ---- Login (hardcoded) ---- */
  ADMIN_NAME: 'Brenton Naidoo',
  FRONTEND_ADMIN_PASSWORD: 'Cantona@1234',

  STAFF_NAME: 'Ricks',
  FRONTEND_STAFF_PASSWORD: 'Staff@1234',

  /* ---- The shared database ----
     This is the SAME Supabase project the Detailers Compass CRM uses, so
     the two apps sit on one set of tables:

        add a quote here      → it is in the CRM
        edit a client in CRM  → it is here on the next refresh
        delete an expense     → it is gone from both

     There is no syncing and no second copy, because there is only one
     database. Set USE_SUPABASE to false to work offline against this
     browser's own storage instead (useful for training or testing —
     nothing written in that mode reaches the CRM).                      */
  USE_SUPABASE: true,

  SUPABASE_URL: 'https://fudgjjckeqlhpvvnsikm.supabase.co',

  /* PUBLISHABLE (anon) key only — never a service-role key in browser code. */
  SUPABASE_ANON_KEY: 'sb_publishable_3YqpzH5ZRVuxw-Ln0qHT8g_qZGo7oSz',

  /* How often to pull changes made in the CRM, in seconds. 0 turns the
     automatic check off and leaves the Refresh button. */
  AUTO_REFRESH_SECONDS: 60
};
