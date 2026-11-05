// 신고 사유 / 대상. DB check 제약(0005_reports_storage.sql)과 key 를 맞춘다.
export const REPORT_REASONS = [
  { key: "spam", label: "스팸·광고" },
  { key: "abuse", label: "욕설·비방" },
  { key: "illegal", label: "불법·유해" },
  { key: "copyright", label: "저작권 침해" },
  { key: "etc", label: "기타" },
] as const;

export const REPORT_TARGETS = ["project", "post", "comment", "review"] as const;

export const reasonLabel = (k: string) => REPORT_REASONS.find((r) => r.key === k)?.label ?? k;
export const targetLabel: Record<string, string> = { project: "프로젝트", post: "게시글", comment: "댓글", review: "후기" };
