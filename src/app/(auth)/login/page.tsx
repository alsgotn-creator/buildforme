import { headers } from "next/headers";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/auth";

async function loginWithGithub() {
  "use server";
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { data, error } = await (await createAuthClient()).auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=1");
  redirect(data.url);
}

async function LoginForm({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-24">
      <h1 className="text-3xl font-bold">로그인</h1>
      <p className="mt-2 text-body">GitHub 계정으로 바로 시작하세요.</p>
      {error && <p className="mt-4 text-sm text-danger">로그인에 실패했어요. 다시 시도해 주세요.</p>}
      <form action={loginWithGithub}>
        <button className="mt-8 h-14 w-full rounded-button bg-primary text-[17px] font-semibold text-white hover:bg-primary-hover active:scale-[0.96]">
          GitHub로 계속하기
        </button>
      </form>
    </main>
  );
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Suspense>
      <LoginForm {...props} />
    </Suspense>
  );
}
