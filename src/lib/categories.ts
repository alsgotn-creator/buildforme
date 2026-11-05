// 프로젝트 카테고리. DB check 제약(0002_category.sql)과 key 를 맞춘다.
export const CATEGORIES = [
  { key: "dev", label: "개발", emoji: "💻" },
  { key: "work", label: "업무", emoji: "📋" },
  { key: "design", label: "디자인", emoji: "🎨" },
  { key: "erp", label: "ERP", emoji: "🏢" },
  { key: "game", label: "게임", emoji: "🎮" },
  { key: "ai", label: "AI", emoji: "🤖" },
  { key: "edu", label: "교육", emoji: "📚" },
  { key: "life", label: "생활", emoji: "🏠" },
  { key: "etc", label: "기타", emoji: "✨" },
] as const;

export const isCategory = (k: unknown): k is string => CATEGORIES.some((c) => c.key === k);
export const categoryOf = (k?: string | null) => CATEGORIES.find((c) => c.key === k) ?? CATEGORIES[CATEGORIES.length - 1];
