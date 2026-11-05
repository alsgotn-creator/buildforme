import Link from "next/link";
import { Suspense } from "react";
import { loginWithEmail } from "@/app/(auth)/actions";
import { Logo } from "@/components/layout/Logo";
import { Divider, SocialLogin } from "@/components/layout/SocialLogin";

const ERRORS: Record<string, string> = {
  credentials: "이메일 또는 비밀번호가 맞지 않아요.",
  provider: "이 로그인 방식은 아직 준비 중이에요.",
  "1": "로그인에 실패했어요. 다시 시도해 주세요.",
};
const input = "mt-1 w-full rounded-md border border-border px-3 py-3 outline-none focus:border-primary";

async function LoginForm({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="w-full max-w-sm rounded-3xl bg-white px-6 py-10">
      <div className="flex justify-center"><Logo /></div>
      <h1 className="mt-6 text-center text-2xl font-bold">로그인</h1>
      {typeof error === "string" && (
        <p role="alert" className="mt-4 text-center text-sm text-danger">{ERRORS[error] ?? ERRORS["1"]}</p>
      )}
      <div className="mt-6"><SocialLogin /></div>
      <Divider />
      <form action={loginWithEmail} className="space-y-4">
        <label className="block text-sm font-semibold">이메일
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        <label className="block text-sm font-semibold">비밀번호
          <input name="password" type="password" required autoComplete="current-password" className={input} />
        </label>
        <button className="h-14 w-full rounded-button bg-primary text-[17px] font-semibold text-white hover:bg-primary-hover active:scale-[0.96]">
          로그인
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-body">
        아직 계정이 없나요? <Link href="/signup" className="font-semibold text-primary">회원가입</Link>
      </p>
    </main>
  );
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <div className="page-bg flex min-h-screen items-center justify-center px-4 py-10">
      <Suspense>
        <LoginForm {...props} />
      </Suspense>
    </div>
  );
}
