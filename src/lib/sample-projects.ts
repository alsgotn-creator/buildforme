import type { CardProject } from "@/components/project/ProjectCard";

// 개발 모드에서 DB 가 비었을 때만 디자인 확인용으로 보여주는 가짜 데이터.
const s = (i: number, title: string, tagline: string, kind: string, hype: number): CardProject => ({
  id: `sample-${i}`, title, tagline, kind, thumbnail_url: null, hypes: [{ count: hype }], profiles: { username: "sample" },
});

export const SAMPLE_PROJECTS: CardProject[] = [
  s(1, "대화할수록 똑똑해지는 AI 메모", "쓸수록 나를 닮아가는 노트 앱", "launch", 128),
  s(2, "볼 때마다 귀여운 나만의 캐릭터", "오늘 기분으로 캐릭터를 만들어요", "launch", 96),
  s(3, "스마트한 하루의 시작 루틴 앱", "날씨·일정·할 일을 한 화면에", "launch", 74),
  s(4, "음악 추천", "취향 기반 플레이리스트", "personal_tool", 51),
  s(5, "막 찍어도 인생샷 사진 편집", "원터치 보정 웹앱", "launch", 43),
  s(6, "지금은 야구 생중계 알리미", "내 팀 경기 시작 알림", "personal_tool", 38),
  s(7, "하루 종일 심심할 틈 없는 게임", "3분짜리 미니게임 모음", "launch", 27),
  s(8, "나보다 나를 잘 아는 심리테스트", "결과 카드로 공유", "launch", 21),
  s(9, "찾았다 나의 영어 1타 튜터", "AI 영어 회화 연습", "launch", 12),
];
