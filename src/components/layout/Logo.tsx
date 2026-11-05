import Link from "next/link";

// "showcase build for me●" — 마지막 마침표는 원형 점
export function Logo() {
  return (
    <Link href="/" aria-label="showcase build for me" className="flex shrink-0 items-end gap-1.5 leading-none">
      <span className="text-xl font-bold tracking-tight">showcase</span>
      <span className="text-sm font-semibold text-body">build for me</span>
      <span aria-hidden className="mb-px h-2 w-2 rounded-full bg-primary" />
    </Link>
  );
}
