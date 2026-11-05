"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// 썸네일: 파일 업로드(미리보기) 또는 이미지 주소 입력. 파일이 있으면 파일이 우선한다.
export function ThumbnailField({ defaultUrl }: { defaultUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(defaultUrl ?? null);
  const [tooBig, setTooBig] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 이전 미리보기 objectURL 정리
  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) {
      setTooBig(true);
      e.target.value = "";
      return;
    }
    setTooBig(false);
    setPreview(URL.createObjectURL(f));
  }

  function clear() {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
  }

  return (
    <div className="text-sm font-semibold">
      <span>썸네일</span>
      <label className="relative mt-1.5 flex aspect-[16/10] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-[#f9fafb] hover:border-primary focus-within:border-primary">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="썸네일 미리보기" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted">
            <ImagePlus size={32} aria-hidden />
            <span className="font-normal">이미지를 선택하세요 (PNG·JPG·WEBP·GIF, 3MB 이하)</span>
          </span>
        )}
        <input ref={fileRef} name="thumbnail_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFile} className="sr-only" />
      </label>
      {preview && (
        <button type="button" onClick={clear} className="mt-2 inline-flex items-center gap-1 text-xs font-normal text-muted hover:text-danger">
          <X size={14} aria-hidden /> 이미지 지우기
        </button>
      )}
      {tooBig && <p role="alert" className="mt-1 text-xs font-normal text-danger">3MB 이하 이미지만 올릴 수 있어요.</p>}
      <label className="mt-3 block text-xs font-normal text-muted">
        또는 이미지 주소
        <input
          name="thumbnail_url"
          type="url"
          placeholder="https://.../image.png"
          defaultValue={preview === null ? "" : (defaultUrl ?? "")}
          key={preview === null ? "empty" : "set"}
          className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
    </div>
  );
}
