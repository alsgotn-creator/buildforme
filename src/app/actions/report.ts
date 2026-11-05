"use server";

import { redirect } from "next/navigation";
import { REPORT_REASONS, REPORT_TARGETS } from "@/lib/reports";
import { getUser } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

export async function submitReport(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");

  const back = String(formData.get("back") ?? "/");
  // 돌아갈 경로는 사이트 내부 경로만 허용 (open redirect 방지)
  const safeBack = back.startsWith("/") && !back.startsWith("//") ? back.split("?")[0] : "/";
  const type = String(formData.get("target_type"));
  const id = String(formData.get("target_id"));
  const reason = String(formData.get("reason"));
  const detail = String(formData.get("detail") ?? "").trim().slice(0, 500);
  if (!REPORT_TARGETS.includes(type as never) || !UUID.test(id) || !REPORT_REASONS.some((r) => r.key === reason)) {
    redirect(`${safeBack}?reported=error`);
  }

  const { error } = await db.from("reports").insert({
    reporter_id: user.id,
    target_type: type,
    target_id: id,
    reason,
    detail: detail || null,
  });
  // 23505 = 이미 신고함(unique). 사용자에게는 접수된 것으로 안내한다.
  redirect(`${safeBack}?reported=${!error || error.code === "23505" ? "1" : "error"}`);
}
