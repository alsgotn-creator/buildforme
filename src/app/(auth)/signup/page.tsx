import { MailCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { signupWithEmail } from "@/app/(auth)/actions";
import { Logo } from "@/components/layout/Logo";
import { Divider, SocialLogin } from "@/components/layout/SocialLogin";
import { PasswordFields } from "@/components/ui/PasswordFields";

const ERRORS: Record<string, string> = {
  email: "이메일 형식을 확인해 주세요.",
  short: "비밀번호는 8자 이상이어야 해요.",
  mismatch: "비밀번호가 서로 달라요. 다시 입력해 주세요.",
  failed: "가입에 실패했어요. 이미 가입된 이메일인지 확인해 주세요.",
};

async function SignupForm({ searchParams }: PageProps<"/signup">) {
  const { error, sent } = await searchParams;

  if (sent) {
    return (
      <main className="w-full max-w-sm rounded-3xl bg-white px-6 py-12 text-center">
        <MailCheck size={48} className="mx-auto text-primary" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">메일을 확인해 주세요</h1>
        <p className="mt-2 text-body">가입 확인 링크를 보냈어요. 링크를 누르면 가입이 끝나요.</p>
        <Link href="/login" className="mt-8 inline-block font-semibold text-primary">로그인으로 돌아가기</Link>
      </main>
    );
  }

  return (
    <main className="w-full max-w-sm rounded-3xl bg-white px-6 py-10">
      <div className="flex justify-center"><Logo /></div>
      <h1 className="mt-6 text-center text-2xl font-bold">회원가입</h1>
      {typeof error === "string" && ERRORS[error] && (
        <p role="alert" className="mt-4 text-center text-sm text-danger">{ERRORS[error]}</p>
      )}
      <div className="mt-6"><SocialLogin /></div>
      <Divider />
      <form action={signupWithEmail} className="space-y-4">
        <label className="block text-sm font-semibold">이메일
          <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-md border border-border px-3 py-3 outline-none focus:border-primary" />
        </label>
        <PasswordFields submitLabel="가입하기" />
      </form>
      <p className="mt-6 text-center text-sm text-body">
        이미 계정이 있나요? <Link href="/login" className="font-semibold text-primary">로그인</Link>
      </p>
    </main>
  );
}

export default function SignupPage(props: PageProps<"/signup">) {
  return (
    <div className="page-bg flex min-h-screen items-center justify-center px-4 py-10">
      <Suspense>
        <SignupForm {...props} />
      </Suspense>
    </div>
  );
}
