import { loginWithProvider } from "@/app/(auth)/actions";
import { GithubIcon, GoogleIcon, KakaoIcon } from "@/components/ui/BrandIcons";

const btn = "flex h-12 w-full items-center justify-center gap-2 rounded-[14px] font-semibold active:scale-[0.96]";

// 구글·카카오·GitHub. 처음 로그인하면 자동으로 가입된다.
export function SocialLogin() {
  return (
    <div className="space-y-2">
      <form action={loginWithProvider}>
        <input type="hidden" name="provider" value="kakao" />
        <button className={`${btn} bg-[#FEE500] text-[#191919]`}><KakaoIcon /> 카카오로 계속하기</button>
      </form>
      <form action={loginWithProvider}>
        <input type="hidden" name="provider" value="google" />
        <button className={`${btn} border border-border bg-white text-foreground hover:bg-[#f9fafb]`}><GoogleIcon /> Google로 계속하기</button>
      </form>
      <form action={loginWithProvider}>
        <input type="hidden" name="provider" value="github" />
        <button className={`${btn} bg-foreground text-white`}><GithubIcon /> GitHub로 계속하기</button>
      </form>
    </div>
  );
}

export function Divider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-muted">
      <span className="h-px flex-1 bg-border" />또는 이메일로<span className="h-px flex-1 bg-border" />
    </div>
  );
}
