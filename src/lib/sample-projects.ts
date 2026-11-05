import type { CardProject } from "@/components/project/ProjectCard";

// 개발 모드에서 DB 가 비었을 때만 디자인 확인용으로 보여주는 가짜 데이터.
const DL = [0, 340, 95, 410, 60, 220, 15, 380, 130, 75]; // 예시 다운로드 수 (index = 샘플 번호)
const s = (i: number, title: string, tagline: string, kind: string, hype: number, category: string): CardProject => ({
  id: `sample-${i}`, title, tagline, kind, category, download_count: DL[i], thumbnail_url: `/samples/${i}.webp`, hypes: [{ count: hype }], profiles: { username: "sample" },
});

export const SAMPLE_PROJECTS: (CardProject & { features?: string[]; install_guide?: string; contact?: string; screenshots?: string[]; platforms?: string[]; pricing?: string; tech_stack?: string[]; version?: string; tags?: string[]; md_text?: string; md_name?: string; md_url?: string })[] = [
  {
    ...s(1, "대화할수록 똑똑해지는 AI 메모", "쓸수록 나를 닮아가는 노트 앱", "launch", 128, "ai"),
    features: ["메모를 쓰면 AI가 자동으로 태그 정리", "음성 메모 → 텍스트 변환", "로그인 없이 바로 사용", "마크다운 내보내기"],
    contact: "hello@example.com",
    screenshots: ["/samples/3.webp", "/samples/9.webp", "/samples/5.webp"],
    platforms: ["web", "ios", "android"],
    pricing: "freemium",
    tech_stack: ["Next.js", "Supabase", "OpenAI API", "Tailwind CSS"],
    version: "v1.2.0",
    tags: ["메모", "AI", "생산성"],
    md_name: "ai-memo-prompt.md",
    md_url: "/samples/ai-memo-prompt.md",
    md_text: "# AI 메모 정리 프롬프트\n\n아래 메모를 읽고 다음 형식으로 정리해 줘.\n\n## 규칙\n- 핵심 내용을 3줄 이내로 요약\n- 할 일은 체크박스(- [ ])로 뽑기\n- 관련 태그 3개를 #태그 형식으로\n\n## 메모\n{{여기에 메모 붙여넣기}}\n",
    install_guide: "git clone https://github.com/example/ai-memo\ncd ai-memo\nnpm install\nnpm run dev",
  },
  s(2, "볼 때마다 귀여운 나만의 캐릭터", "오늘 기분으로 캐릭터를 만들어요", "launch", 96, "design"),
  s(3, "스마트한 하루의 시작 루틴 앱", "날씨·일정·할 일을 한 화면에", "launch", 74, "work"),
  s(4, "음악 추천", "취향 기반 플레이리스트", "personal_tool", 51, "life"),
  s(5, "막 찍어도 인생샷 사진 편집", "원터치 보정 웹앱", "launch", 43, "design"),
  s(6, "지금은 야구 생중계 알리미", "내 팀 경기 시작 알림", "personal_tool", 38, "dev"),
  s(7, "하루 종일 심심할 틈 없는 게임", "3분짜리 미니게임 모음", "launch", 27, "game"),
  s(8, "나보다 나를 잘 아는 심리테스트", "결과 카드로 공유", "launch", 21, "game"),
  s(9, "찾았다 나의 영어 1타 튜터", "AI 영어 회화 연습", "launch", 12, "edu"),
];
