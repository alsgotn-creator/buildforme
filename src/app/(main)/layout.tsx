import { Search, Shield } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAuthClient, getViewer } from "@/lib/supabase/auth";

async function logout() {
  "use server";
  await (await createAuthClient()).auth.signOut();
  redirect("/");
}

const pill = "flex h-9 items-center rounded-lg bg-foreground px-3.5 text-sm font-semibold text-white";

async function Nav() {
  const user = await getViewer();
  return (
    <nav className="flex items-center gap-2">
      {user ? (
        <>
          {user.isAdmin && (
            <Link href="/admin" className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-body hover:bg-white/70">
              <Shield size={16} aria-hidden /> 관리자
            </Link>
          )}
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
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:h-14 sm:flex-nowrap sm:py-0">
          <Logo />
          <nav aria-label="주요 메뉴" className="flex gap-1 text-sm font-semibold text-body">
            <Link href="/" className="rounded-lg px-2.5 py-1.5 hover:bg-white/70 hover:text-foreground">프로젝트</Link>
            <Link href="/community" className="rounded-lg px-2.5 py-1.5 hover:bg-white/70 hover:text-foreground">커뮤니티</Link>
          </nav>
          <Form action="/" className="relative order-last w-full sm:order-none sm:ml-auto sm:max-w-xs" role="search">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              name="q"
              type="search"
              placeholder="프로젝트 검색"
              aria-label="사이트 내 검색"
              maxLength={50}
              className="h-9 w-full rounded-lg bg-white/80 pl-9 pr-3 text-sm outline-none placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-primary/40"
            />
          </Form>
          <div className="ml-auto sm:ml-0">
            <Suspense fallback={<span />}>
              <Nav />
            </Suspense>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="py-8 text-center text-xs text-muted">© showcase-hub · 개인이 만든 앱·웹 커뮤니티</footer>
    </div>
  );
}
