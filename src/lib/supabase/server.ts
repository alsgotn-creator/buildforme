import "server-only";
import { createClient } from "@supabase/supabase-js";

// service role key 는 서버에서만 사용. DB 접근은 이 클라이언트로만 한다.
export const db = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);