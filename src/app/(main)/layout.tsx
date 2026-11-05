import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAuthClient, getUser } from "@/lib/supabase/auth";

async function logout() {
  "use server";
  await (await createAuthClient()).auth.signOut();
  redirect("/");
}

async function Nav() {
  const user = await getUser();
  return (
          <nav className="flex items-center gap-4 text-sm text-body">
            {user ? (
              <>
                <Link href="/projects/new">올리기</Link>
                <form action={logout}><button>로그아웃</button></form>
              </>
            ) : (
              <Link href="/login">로그인</Link>
            )}
          </nav>
  );
}

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-bold">showcase-hub</Link>
          <Suspense fallback={<span />}>
            <Nav />
          </Suspense>
        </div>
      </header>
      {children}
    </>
  );
}
