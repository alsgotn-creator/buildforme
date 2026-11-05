import { NextResponse } from "next/server";
import { createAuthClient, ensureProfile } from "@/lib/supabase/auth";

// OAuth(구글·카카오·GitHub) 로그인과 이메일 가입 확인 링크가 모두 여기로 돌아온다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/login?error=1`);

  const auth = await createAuthClient();
  const { data, error } = await auth.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=1`);
  if (!(await ensureProfile(data.user))) return NextResponse.redirect(`${origin}/login?error=1`);
  return NextResponse.redirect(`${origin}/`);
}
