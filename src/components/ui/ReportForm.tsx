import { Flag } from "lucide-react";
import { submitReport } from "@/app/actions/report";
import { REPORT_REASONS } from "@/lib/reports";

// 접었다 펴는 신고 폼 (JS 없이 동작하는 <details>)
export function ReportForm({ type, id, back, status }: { type: string; id: string; back: string; status?: string }) {
  if (status === "1") return <p role="status" className="text-sm text-muted">신고가 접수됐어요. 확인 후 조치할게요.</p>;
  return (
    <details className="group text-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-muted hover:text-danger">
        <Flag size={14} aria-hidden /> 신고
      </summary>
      <form action={submitReport} className="mt-3 space-y-2 rounded-2xl bg-surface p-4">
        <input type="hidden" name="target_type" value={type} />
        <input type="hidden" name="target_id" value={id} />
        <input type="hidden" name="back" value={back} />
        {status === "error" && <p role="alert" className="text-danger">신고에 실패했어요. 다시 시도해 주세요.</p>}
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 font-semibold">신고 사유</legend>
          {REPORT_REASONS.map((r, i) => (
            <label key={r.key} className="cursor-pointer">
              <input type="radio" name="reason" value={r.key} defaultChecked={i === 0} className="peer sr-only" />
              <span className="flex h-8 items-center rounded-full bg-white px-3 peer-checked:bg-foreground peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary">{r.label}</span>
            </label>
          ))}
        </fieldset>
        <textarea name="detail" rows={2} maxLength={500} placeholder="자세한 내용 (선택)" className="w-full rounded-md border border-border bg-white px-3 py-2 outline-none focus:border-primary" />
        <button className="h-10 rounded-xl bg-danger px-4 font-semibold text-white">신고하기</button>
      </form>
    </details>
  );
}
