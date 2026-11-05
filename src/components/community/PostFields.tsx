import { TOPICS } from "@/lib/community";

const input = "mt-1 w-full rounded-md border border-border px-3 py-3 outline-none focus:border-primary";

// 글쓰기 / 글 수정 공통 입력칸
export function PostFields({ d = {} }: { d?: { topic?: string; title?: string; body?: string } }) {
  return (
    <>
      <fieldset>
        <legend className="text-sm font-semibold">말머리</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {TOPICS.map((t, i) => (
            <label key={t.key} className="cursor-pointer">
              <input type="radio" name="topic" value={t.key} defaultChecked={d.topic ? d.topic === t.key : i === 0} className="peer sr-only" />
              <span className="flex h-9 items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-semibold text-body peer-checked:bg-foreground peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                <t.Icon size={16} aria-hidden /> {t.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-semibold">제목
        <input name="title" required maxLength={100} defaultValue={d.title} className={input} />
      </label>
      <label className="block text-sm font-semibold">내용
        <textarea name="body" required rows={12} maxLength={10000} defaultValue={d.body} className={input} />
      </label>
    </>
  );
}
