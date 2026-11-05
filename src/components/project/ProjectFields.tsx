const input = "mt-1 w-full rounded-md border border-border px-3 py-3 outline-none focus:border-primary";

type Defaults = {
  title?: string;
  tagline?: string | null;
  kind?: string;
  url?: string | null;
  repo_url?: string | null;
  thumbnail_url?: string | null;
  tags?: string[];
  description?: string | null;
};

export function ProjectFields({ d = {} }: { d?: Defaults }) {
  return (
    <>
      <label className="block text-sm font-semibold">제목
        <input name="title" required maxLength={100} defaultValue={d.title} className={input} />
      </label>
      <label className="block text-sm font-semibold">한 줄 소개
        <input name="tagline" maxLength={150} defaultValue={d.tagline ?? ""} className={input} />
      </label>
      <label className="block text-sm font-semibold">종류
        <select name="kind" defaultValue={d.kind ?? "launch"} className={input}>
          <option value="launch">출시한 서비스</option>
          <option value="personal_tool">개인용 도구</option>
        </select>
      </label>
      <label className="block text-sm font-semibold">서비스 링크
        <input name="url" type="url" placeholder="https://" defaultValue={d.url ?? ""} className={input} />
      </label>
      <label className="block text-sm font-semibold">GitHub 링크
        <input name="repo_url" type="url" placeholder="https://github.com/..." defaultValue={d.repo_url ?? ""} className={input} />
      </label>
      <label className="block text-sm font-semibold">썸네일 이미지 링크
        <input name="thumbnail_url" type="url" placeholder="https://.../image.png" defaultValue={d.thumbnail_url ?? ""} className={input} />
      </label>
      <label className="block text-sm font-semibold">태그 (쉼표로 구분, 최대 5개)
        <input name="tags" defaultValue={d.tags?.join(", ")} className={input} />
      </label>
      <label className="block text-sm font-semibold">설명
        <textarea name="description" rows={6} maxLength={5000} defaultValue={d.description ?? ""} className={input} />
      </label>
    </>
  );
}
