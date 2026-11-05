import { CircleHelp, HandHelping, Megaphone, MessageCircle, type LucideIcon } from "lucide-react";

// 말머리. DB check 제약(0003_community.sql)과 key 를 맞춘다.
export const TOPICS: readonly { key: string; label: string; Icon: LucideIcon; cls: string }[] = [
  { key: "chat", label: "잡담", Icon: MessageCircle, cls: "bg-surface text-body" },
  { key: "question", label: "질문", Icon: CircleHelp, cls: "bg-weak-bg text-weak-fg" },
  { key: "feedback", label: "피드백 요청", Icon: HandHelping, cls: "bg-[#f0faf6] text-[#029359]" },
  { key: "promo", label: "홍보", Icon: Megaphone, cls: "bg-[#fff3e0] text-[#f57800]" },
];

export const isTopic = (k: unknown): k is string => TOPICS.some((t) => t.key === k);

// 글쓰기/수정 공통 검증. 실패하면 null.
export function parsePostForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const topic = String(formData.get("topic"));
  if (!title || title.length > 100 || !body || body.length > 10000) return null;
  return { title, body, topic: isTopic(topic) ? topic : "chat" };
}
export const topicOf = (k?: string | null) => TOPICS.find((t) => t.key === k) ?? TOPICS[0];

// "방금 전 / 5분 전 / 3시간 전 / 2일 전 / 2026.11.05"
export function timeAgo(iso: string) {
  const sec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (sec < 60) return "방금 전";
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

export type PostRow = {
  id: string;
  topic: string;
  title: string;
  body: string;
  created_at: string;
  author_id?: string;
  profiles: { username: string } | { username: string }[] | null;
  post_comments: { count: number }[] | null;
};

// shortcut: DB 에 글이 없을 때 보여주는 예시 글(초기 오픈용). 실제 글이 쌓이면 지울 것.
const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();
const p = (i: number, topic: string, title: string, body: string, min: number, comments: number, username: string): PostRow => ({
  id: `sample-${i}`, topic, title, body, created_at: ago(min), profiles: { username }, post_comments: [{ count: comments }],
});
export const SAMPLE_POSTS: PostRow[] = [
  p(1, "feedback", "첫 사이드 프로젝트 올렸어요! 랜딩 페이지 피드백 부탁드려요", "AI 메모 앱 만들었는데 첫 화면이 너무 밋밋한 것 같아서요. 솔직한 의견 환영합니다.", 4, 12, "minsoo"),
  p(2, "question", "Supabase 무료 플랜으로 어디까지 버틸 수 있나요?", "DAU 500 정도 예상하는데 무료로 충분할지 궁금합니다.", 38, 8, "devkim"),
  p(3, "chat", "퇴근하고 3개월 동안 만든 앱, 드디어 첫 결제 발생", "금액은 작지만 너무 신기하네요. 다들 포기하지 마세요!", 180, 31, "jiyoung"),
  p(4, "promo", "엑셀 지옥 탈출용 미니 ERP 오픈소스로 공개했습니다", "소규모 가게 재고·발주 관리용입니다. 깃허브 링크는 프로젝트 페이지에!", 420, 5, "erp_lee"),
  p(5, "question", "Next.js 16 Cache Components 쓰시는 분 계신가요?", "Suspense 경계를 어디에 둬야 할지 감이 안 와요.", 1500, 14, "frontend_park"),
  p(6, "chat", "다들 아이디어는 어디서 얻으세요?", "요즘 만들고 싶은 게 안 떠올라서 슬럼프네요.", 3000, 22, "maker"),
];
