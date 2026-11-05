"use client";

import { Check, Eye, EyeOff, X } from "lucide-react";
import { useState } from "react";

const input = "mt-1 w-full rounded-md border border-border px-3 py-3 pr-11 outline-none focus:border-primary";

// 비밀번호 + 비밀번호 확인. 입력하는 동안 일치 여부를 바로 보여주고, 불일치면 제출 버튼을 막는다.
export function PasswordFields({ submitLabel }: { submitLabel: string }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const tooShort = pw.length > 0 && pw.length < 8;
  const mismatch = confirm.length > 0 && pw !== confirm;
  const ok = pw.length >= 8 && pw === confirm;

  return (
    <>
      <label className="block text-left text-sm font-semibold">
        비밀번호
        <span className="relative block">
          <input name="password" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={input} aria-describedby="pw-help" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-muted" aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
        <span id="pw-help" className={`mt-1 block text-xs font-normal ${tooShort ? "text-danger" : "text-muted"}`}>8자 이상 입력해 주세요.</span>
      </label>
      <label className="block text-left text-sm font-semibold">
        비밀번호 확인
        <input name="password_confirm" type={show ? "text" : "password"} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} aria-invalid={mismatch} aria-describedby="pw-match" />
        <span id="pw-match" aria-live="polite" className="mt-1 flex h-4 items-center gap-1 text-xs font-normal">
          {mismatch && (<><X size={14} className="text-danger" /> <span className="text-danger">비밀번호가 일치하지 않아요.</span></>)}
          {ok && (<><Check size={14} className="text-[#029359]" /> <span className="text-[#029359]">비밀번호가 일치해요.</span></>)}
        </span>
      </label>
      <button disabled={!ok} className="h-14 w-full rounded-button bg-primary text-[17px] font-semibold text-white hover:bg-primary-hover active:scale-[0.96] disabled:bg-[#b0b8c1] disabled:active:scale-100">
        {submitLabel}
      </button>
    </>
  );
}
