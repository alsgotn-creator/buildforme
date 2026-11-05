"use server";

import { cleanFilters, fetchFeed } from "@/lib/feed";

// 무한 스크롤: 다음 묶음을 불러온다. 필터는 서버에서 다시 정리한다.
export async function loadMoreProjects(raw: Record<string, string>, page: number) {
  const p = Number.isInteger(page) ? Math.min(Math.max(page, 2), 500) : 2;
  return fetchFeed(cleanFilters(raw), p);
}
