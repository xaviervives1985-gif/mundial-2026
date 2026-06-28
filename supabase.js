import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/*
  Pega aquí tus datos de Supabase:

  Supabase → Project Settings → API

  Usa:
  - Project URL
  - anon public key

  NO uses la service_role key.
*/

export const SUPABASE_URL = "https://etfkwmeymzzwnyrxurfj.supabase.co";
export const SUPABASE_ANON_KEY =  "sb_publishable_FJ_mCbtiiGmxpT-30Pjw3A_k7MXxCKv";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
