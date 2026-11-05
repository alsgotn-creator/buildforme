import { Globe, Laptop, Monitor, Puzzle, Smartphone, TabletSmartphone, Terminal, type LucideIcon } from "lucide-react";

// 지원 플랫폼 / 가격. DB check 제약(0006_project_details.sql)과 key 를 맞춘다.
export const PLATFORMS: readonly { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "web", label: "웹", Icon: Globe },
  { key: "ios", label: "iOS", Icon: Smartphone },
  { key: "android", label: "Android", Icon: TabletSmartphone },
  { key: "windows", label: "Windows", Icon: Monitor },
  { key: "mac", label: "macOS", Icon: Laptop },
  { key: "linux", label: "Linux", Icon: Terminal },
  { key: "extension", label: "브라우저 확장", Icon: Puzzle },
];

export const PRICING: readonly { key: string; label: string; cls: string }[] = [
  { key: "free", label: "무료", cls: "bg-[#f0faf6] text-[#029359]" },
  { key: "freemium", label: "부분 유료", cls: "bg-[#fff3e0] text-[#f57800]" },
  { key: "paid", label: "유료", cls: "bg-[#f9f0fc] text-[#8222a2]" },
];

export const MAX_SCREENSHOTS = 8;

// YouTube 주소에서 영상 id 를 뽑는다 (watch?v= / youtu.be / shorts / embed). 아니면 null.
export function youtubeId(url: string | null | undefined) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
