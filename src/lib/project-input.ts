const isHttp = (v: string) => /^https?:\/\//i.test(v);

// 등록/수정 공통 폼 검증. 실패하면 에러 코드를 돌려준다.
export function parseProjectForm(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const title = str("title");
  const url = str("url");
  const repoUrl = str("repo_url");
  const thumb = str("thumbnail_url");
  if (!title || title.length > 100) return { error: "title" as const };
  // http(s) 만 허용 (javascript: 링크 방지)
  if ((url && !isHttp(url)) || (repoUrl && !isHttp(repoUrl)) || (thumb && !isHttp(thumb))) return { error: "url" as const };
  return {
    values: {
      title,
      tagline: str("tagline") || null,
      description: str("description") || null,
      kind: str("kind") === "personal_tool" ? "personal_tool" : "launch",
      url: url || null,
      repo_url: repoUrl || null,
      thumbnail_url: thumb || null,
      tags: str("tags").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5),
    },
  };
}

export const PROJECT_ERRORS: Record<string, string> = {
  title: "제목은 1~100자로 입력해 주세요.",
  url: "링크는 http:// 또는 https:// 로 시작해야 해요.",
  save: "저장에 실패했어요. 다시 시도해 주세요.",
};
