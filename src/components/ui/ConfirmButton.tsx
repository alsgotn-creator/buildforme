"use client";

// 서버 액션 form 안의 제출 버튼. 누르면 확인창을 띄우고, 취소하면 제출하지 않는다.
export function ConfirmButton({
  message = "정말 삭제할까요? 되돌릴 수 없어요.",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { message?: string }) {
  return (
    <button
      {...rest}
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
