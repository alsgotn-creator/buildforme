import "server-only";
import { createClient } from "@supabase/supabase-js";

// shortcut: 키 미설정 시 더미 값으로 화면만 띄움(쿼리는 실패해 빈 목록). Supabase 연결 후 .env.local 을 채울 것.
const PLACEHOLDER_URL = "http://localhost:54321";

// secret key(구 service role) 는 서버에서만 사용. DB 접근은 이 클라이언트로만 한다.
export const db = createClient(
  process.env.SUPABASE_URL ?? PLACEHOLDER_URL,
  process.env.SUPABASE_SECRET_KEY ?? "missing",
  { auth: { persistSession: false, autoRefreshToken: false } },
);