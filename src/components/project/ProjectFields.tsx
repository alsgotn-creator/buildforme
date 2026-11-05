import { CATEGORIES } from "@/lib/categories";
import { ThumbnailField } from "./ThumbnailField";

const input = "mt-1.5 w-full rounded-md border border-border px-3 py-3 font-normal outline-none focus:border-primary";
const hint = "mt-1 block text-xs font-normal text-muted";

type Defaults = {
  title?: string;
  tagline?: string | null;
  kind?: string;
  category?: string;
  url?: string | null;
  repo_url?: string | null;
  thumbnail_url?: string | null;
  tags?: string[];
  description?: string | null;
  features?: string[];
  install_guide?: string | null;
  contact?: string | null;
};

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5 border-t border-border pt-8 first:border-t-0 first:pt-0">
      <legend className="flex items-center gap-2 text-lg font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-weak-bg text-sm text-weak-fg">{step}</span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

// 등록/수정 공통 폼. 홍보에 필요한 순서대로: 기본 정보 → 도메인 → 홍보 내용 → 연락처
export function ProjectFields({ d = {} }: { d?: Defaults }) {
  return (
    <div className="space-y-8">
      <Section step={1} title="기본 정보">
        <label className="block text-sm font-semibold">프로젝트명 <span className="text-danger">*</span>
          <input name="title" required maxLength={100} defaultValue={d.title} placeholder="예: 똑똑한 AI 메모" className={input} />
        </label>
        <label className="block text-sm font-semibold">한 줄 소개
          <input name="tagline" maxLength={150} defaultValue={d.tagline ?? ""} placeholder="예: 쓸수록 나를 닮아가는 노트 앱" className={input} />
          <span className={hint}>카드에 제목 아래로 보여요. 누구를 위한 무엇인지 한 문장으로.</span>
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold">카테고리
            <select name="category" defaultValue={d.category ?? "etc"} className={input}>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">종류
            <select name="kind" defaultValue={d.kind ?? "launch"} className={input}>
              <option value="launch">출시한 서비스</option>
              <option value="personal_tool">개인용 도구</option>
            </select>
          </label>
        </div>
        <ThumbnailField defaultUrl={d.thumbnail_url} />
      </Section>

      <Section step={2} title="도메인 · 링크">
        <label className="block text-sm font-semibold">서비스 도메인
          <input name="url" type="url" placeholder="https://my-app.com" defaultValue={d.url ?? ""} className={input} />
          <span className={hint}>방문자가 바로 써볼 수 있는 주소예요. https:// 로 시작해야 해요.</span>
        </label>
        <label className="block text-sm font-semibold">GitHub 저장소
          <input name="repo_url" type="url" placeholder="https://github.com/..." defaultValue={d.repo_url ?? ""} className={input} />
        </label>
      </Section>

      <Section step={3} title="홍보 내용">
        <label className="block text-sm font-semibold">특징
          <textarea name="features" rows={4} placeholder={"로그인 없이 바로 사용\n다크모드 지원\n엑셀 내보내기"} defaultValue={d.features?.join("\n")} className={input} />
          <span className={hint}>한 줄에 하나씩, 최대 10개. 상세 페이지에 체크리스트로 보여요.</span>
        </label>
        <label className="block text-sm font-semibold">자세한 설명
          <textarea name="description" rows={6} maxLength={5000} defaultValue={d.description ?? ""} placeholder="왜 만들었는지, 어떤 문제를 해결하는지 들려주세요." className={input} />
        </label>
        <label className="block text-sm font-semibold">설치 · 사용 방법
          <textarea name="install_guide" rows={5} maxLength={5000} placeholder={"git clone https://github.com/...\nnpm install\nnpm run dev"} defaultValue={d.install_guide ?? ""} className={`${input} font-mono text-sm`} />
        </label>
        <label className="block text-sm font-semibold">태그
          <input name="tags" defaultValue={d.tags?.join(", ")} placeholder="Next.js, 생산성, 무료" className={input} />
          <span className={hint}>쉼표로 구분, 최대 5개.</span>
        </label>
      </Section>

      <Section step={4} title="연락받을 곳">
        <label className="block text-sm font-semibold">연락처
          <input name="contact" maxLength={200} defaultValue={d.contact ?? ""} placeholder="이메일, 오픈채팅·인스타그램 링크 등" className={input} />
          <span className={hint}>제휴·피드백 문의를 받을 곳이에요. 상세 페이지에 공개돼요.</span>
        </label>
      </Section>
    </div>
  );
}
