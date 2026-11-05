import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAuthClient, getUser } from "@/lib/supabase/auth";

async function logout() {
  "use server";
  await (await createAuthClient()).auth.signOut();
  redirect("/");
}

const pill = "flex h-9 items-center rounded-lg bg-foreground px-3.5 text-sm font-semibold text-white";

async function Nav() {
  const user = await getUser();
  return (
    <nav className="flex items-center gap-2">
      {user ? (
        <>
          <Link href="/projects/new" className={pill}>올리기</Link>
          <form action={logout}><button className="h-9 px-2 text-sm text-body">로그아웃</button></form>
        </>
      ) : (
        <Link href="/login" className={pill}>로그인</Link>
      )}
    </nav>
  );
}

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="page-bg flex min-h-screen flex-col overflow-x-clip">
      <header className="sticky top-0 z-10 bg-[#dfe7f5]/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            showcase<span className="text-primary">.</span>
          </Link>
          <Suspense fallback={<span />}>
            <Nav />
          </Suspense>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="py-8 text-center text-xs text-muted">© showcase-hub · 개인이 만든 앱·웹 커뮤니티</footer>
    </div>
  );
}
