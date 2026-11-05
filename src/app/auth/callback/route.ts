import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/login?error=1`);

  const auth = await createAuthClient();
  const { data, error } = await auth.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=1`);

  const { user } = data;
  const meta = user.user_metadata;
  // 첫 로그인 시 프로필 생성. 이미 있으면 건드리지 않는다.
  const { data: existing } = await db.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!existing) {
    const base = String(meta.user_name ?? meta.preferred_username ?? "user").toLowerCase();
    // 중복 username 은 id 앞 6자리를 붙여 회피한다.
    const { data: taken } = await db.from("profiles").select("id").eq("username", base).maybeSingle();
    const { error: insertError } = await db.from("profiles").insert({
      id: user.id,
      username: taken ? `${base}-${user.id.slice(0, 6)}` : base,
      display_name: meta.full_name ?? meta.name ?? null,
      avatar_url: meta.avatar_url ?? null,
    });
    if (insertError) return NextResponse.redirect(`${origin}/login?error=1`);
  }
  return NextResponse.redirect(`${origin}/`);
}
