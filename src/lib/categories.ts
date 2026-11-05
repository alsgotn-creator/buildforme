import { Bot, Briefcase, Building2, Code, Gamepad2, GraduationCap, House, Palette, Sparkles, type LucideIcon } from "lucide-react";

// 프로젝트 카테고리. DB check 제약(0002_category.sql)과 key 를 맞춘다.
export const CATEGORIES: readonly { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "dev", label: "개발", Icon: Code },
  { key: "work", label: "업무", Icon: Briefcase },
  { key: "design", label: "디자인", Icon: Palette },
  { key: "erp", label: "ERP", Icon: Building2 },
  { key: "game", label: "게임", Icon: Gamepad2 },
  { key: "ai", label: "AI", Icon: Bot },
  { key: "edu", label: "교육", Icon: GraduationCap },
  { key: "life", label: "생활", Icon: House },
  { key: "etc", label: "기타", Icon: Sparkles },
];

export const isCategory = (k: unknown): k is string => CATEGORIES.some((c) => c.key === k);
export const categoryOf = (k?: string | null) => CATEGORIES.find((c) => c.key === k) ?? CATEGORIES[CATEGORIES.length - 1];
