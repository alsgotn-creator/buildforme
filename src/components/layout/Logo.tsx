import Image from "next/image";
import Link from "next/link";

// [마크] showcase ── build for me● — 마크는 Higgsfield 로 만든 스포트라이트 아이콘(public/logo-mark.png)
export function Logo() {
  return (
    <Link href="/" aria-label="showcase build for me" className="flex shrink-0 items-center gap-2 leading-none">
      <Image src="/logo-mark.png" alt="" width={28} height={28} className="rounded-[7px]" priority />
      <span className="text-xl font-black tracking-[-0.04em]">showcase</span>
      <span aria-hidden className="h-px w-6 bg-foreground/40" />
      <span className="flex items-end gap-1">
        <span className="text-sm font-bold tracking-[-0.02em] text-body">build for me</span>
        <span aria-hidden className="mb-px h-2 w-2 rounded-full bg-primary" />
      </span>
    </Link>
  );
}
