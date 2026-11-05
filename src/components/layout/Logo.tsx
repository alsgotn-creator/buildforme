import Link from "next/link";

// "showcase ── build for me●" — 가운데 가로선, 마지막 마침표는 원형 점
export function Logo() {
  return (
    <Link href="/" aria-label="showcase build for me" className="flex shrink-0 items-center gap-2 leading-none">
      <span className="text-xl font-bold tracking-tight">showcase</span>
      <span aria-hidden className="h-px w-6 bg-foreground/40" />
      <span className="flex items-end gap-1">
        <span className="text-sm font-semibold text-body">build for me</span>
        <span aria-hidden className="mb-px h-2 w-2 rounded-full bg-primary" />
      </span>
    </Link>
  );
}
