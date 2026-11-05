import { isCategory } from "@/lib/categories";
import { MAX_SCREENSHOTS, PLATFORMS, PRICING } from "@/lib/project-meta";

const isHttp = (v: string) => /^https?:\/\//i.test(v);
const list = (v: string, sep: string, max: number, len = 100) =>
  v.split(sep).map((x) => x.trim().slice(0, len)).filter(Boolean).slice(0, max);

// 등록/수정 공통 폼 검증. 실패하면 에러 코드를 돌려준다.
export function parseProjectForm(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const title = str("title");
  const url = str("url");
  const repoUrl = str("repo_url");
  const thumb = str("thumbnail_url");
  const video = str("video_url");
  // 슬라이드 이미지: 업로드 후 hidden input 으로 넘어온 주소들 (순서 유지)
  const screenshots = formData.getAll("screenshots").map(String).filter(Boolean).slice(0, MAX_SCREENSHOTS);

  if (!title || title.length > 100) return { error: "title" as const };
  // http(s) 만 허용 (javascript: 링크 방지)
  if ([url, repoUrl, thumb, video, ...screenshots].some((v) => v && !isHttp(v))) return { error: "url" as const };

  const pricing = str("pricing");
  return {
    values: {
      title,
      tagline: str("tagline") || null,
      description: str("description") || null,
      category: isCategory(str("category")) ? str("category") : "etc",
      kind: str("kind") === "personal_tool" ? "personal_tool" : "launch",
      url: url || null,
      repo_url: repoUrl || null,
      thumbnail_url: thumb || null,
      screenshots,
      video_url: video || null,
      platforms: formData.getAll("platforms").map(String).filter((p) => PLATFORMS.some((x) => x.key === p)),
      pricing: PRICING.some((p) => p.key === pricing) ? pricing : null,
      tech_stack: list(str("tech_stack"), ",", 10, 30),
      version: str("version").slice(0, 30) || null,
      // 특징: 한 줄에 하나, 최대 10개 · 줄당 100자
      features: list(str("features"), "\n", 10),
      install_guide: str("install_guide").slice(0, 5000) || null,
      contact: str("contact").slice(0, 200) || null,
      tags: list(str("tags"), ",", 5, 30),
    },
  };
}

export const PROJECT_ERRORS: Record<string, string> = {
  title: "제목은 1~100자로 입력해 주세요.",
  url: "링크는 http:// 또는 https:// 로 시작해야 해요.",
  save: "저장에 실패했어요. 다시 시도해 주세요.",
  image: "썸네일은 PNG·JPG·WEBP·GIF, 3MB 이하만 올릴 수 있어요.",
  upload: "파일 업로드에 실패했어요. 다시 시도해 주세요.",
  md: "MD 파일은 .md 확장자, 1MB 이하만 올릴 수 있어요.",
};
