"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthClient, ensureProfile } from "@/lib/supabase/auth";

const PROVIDERS = ["google", "kakao", "github"] as const;
type Provider = (typeof PROVIDERS)[number];

async function origin() {
  return (await headers()).get("origin") ?? "http://localhost:3000";
}

// 구글·카카오·GitHub 소셜 로그인 (가입도 겸함)
export async function loginWithProvider(formData: FormData) {
  const provider = String(formData.get("provider")) as Provider;
  if (!PROVIDERS.includes(provider)) redirect("/login?error=1");
  // Supabase 에서 아직 켜지 않은 로그인 방식이면 Supabase 오류 화면 대신 '준비 중' 안내로 돌려보낸다
  const settings = await fetch(`${process.env.SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY ?? "" },
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!settings?.external?.[provider]) redirect("/login?error=provider");
  const { data, error } = await (await createAuthClient()).auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${await origin()}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=provider");
  redirect(data.url);
}

// 이메일 + 비밀번호 로그인
export async function loginWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { data, error } = await (await createAuthClient()).auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect("/login?error=credentials");
  if (!(await ensureProfile(data.user))) redirect("/login?error=1");
  redirect("/");
}

// 이메일 회원가입. 비밀번호 확인은 클라이언트에서도 막지만 서버에서 다시 검사한다.
export async function signupWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/signup?error=email");
  if (password.length < 8) redirect("/signup?error=short");
  if (password !== confirm) redirect("/signup?error=mismatch");

  const { error } = await (await createAuthClient()).auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await origin()}/auth/callback` },
  });
  if (error) redirect("/signup?error=failed");
  redirect("/signup?sent=1");
}
