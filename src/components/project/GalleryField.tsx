"use client";

import { ChevronLeft, ChevronRight, ImagePlus, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { createImageUploadUrl } from "@/app/actions/upload";
import { MAX_SCREENSHOTS } from "@/lib/project-meta";

const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 3 * 1024 * 1024;

// 슬라이드 이미지 업로더: 여러 장 선택 → Storage 로 바로 업로드 → 주소를 hidden input 으로 폼에 싣는다.
export function GalleryField({ defaultUrls = [] }: { defaultUrls?: string[] }) {
  const [urls, setUrls] = useState<string[]>(defaultUrls);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");

  async function upload(file: File) {
    if (!TYPES.includes(file.type) || file.size > MAX_BYTES) throw new Error("PNG·JPG·WEBP·GIF, 3MB 이하만 올릴 수 있어요.");
    const res = await createImageUploadUrl(file.type);
    if ("error" in res) throw new Error(res.error === "login" ? "로그인이 필요해요." : "업로드 주소를 받지 못했어요.");
    // supabase-js uploadToSignedUrl 과 같은 형식(FormData)으로 보낸다
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    const put = await fetch(res.signedUrl, { method: "PUT", body, headers: { "x-upsert": "false" } });
    if (!put.ok) throw new Error("업로드에 실패했어요.");
    return res.publicUrl;
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_SCREENSHOTS - urls.length);
    e.target.value = "";
    if (!files.length) return;
    setError("");
    setBusy(files.length);
    // 순서를 지키려고 하나씩 올린다
    for (const f of files) {
      try {
        const url = await upload(f);
        setUrls((u) => [...u, url].slice(0, MAX_SCREENSHOTS));
      } catch (err) {
        setError(err instanceof Error ? err.message : "업로드에 실패했어요.");
      }
      setBusy((n) => n - 1);
    }
  }

  const move = (i: number, d: number) =>
    setUrls((u) => {
      const next = [...u];
      const j = i + d;
      if (j < 0 || j >= next.length) return u;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="text-sm font-semibold">
      <span>슬라이드 이미지 <span className="font-normal text-muted">({urls.length}/{MAX_SCREENSHOTS})</span></span>
      <span className="mt-1 block text-xs font-normal text-muted">상세 페이지 맨 위 슬라이드에 썸네일 다음으로 보여요. 실제 화면 캡처를 올려 주세요.</span>
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {urls.map((u, i) => (
          <li key={u} className="group relative aspect-[16/10] overflow-hidden rounded-xl bg-surface">
            <input type="hidden" name="screenshots" value={u} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={`슬라이드 ${i + 1}`} className="h-full w-full object-cover" />
            <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 text-xs text-white">{i + 1}</span>
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 p-1">
              <span className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="앞으로" className="rounded-md bg-white/90 p-1 disabled:opacity-30"><ChevronLeft size={14} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === urls.length - 1} aria-label="뒤로" className="rounded-md bg-white/90 p-1 disabled:opacity-30"><ChevronRight size={14} /></button>
              </span>
              <button type="button" onClick={() => setUrls((x) => x.filter((_, k) => k !== i))} aria-label="삭제" className="rounded-md bg-white/90 p-1 text-danger"><X size={14} /></button>
            </div>
          </li>
        ))}
        {urls.length + busy < MAX_SCREENSHOTS && (
          <li>
            <label className="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-[#f9fafb] text-muted hover:border-primary focus-within:border-primary">
              <ImagePlus size={24} aria-hidden />
              <span className="text-xs font-normal">이미지 추가</span>
              <input type="file" multiple accept={TYPES.join(",")} onChange={onFiles} className="sr-only" />
            </label>
          </li>
        )}
        {Array.from({ length: busy }, (_, i) => (
          <li key={`busy-${i}`} className="flex aspect-[16/10] items-center justify-center rounded-xl bg-surface text-muted" aria-label="업로드 중">
            <LoaderCircle size={20} className="animate-spin" aria-hidden />
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-2 text-xs font-normal text-danger">{error}</p>}
    </div>
  );
}
