import { AuthPanel } from "@/components/admin/auth-panel";
import { SetNewPasswordForm } from "@/app/admin/passwort/[token]/set-form";

export const metadata = { title: "Neues Passwort setzen · Vox Audax Redaktion" };

/**
 * The page the mailed link leads to. The token is not looked up here: the
 * library resolves it when the password is submitted, and a page that checked
 * first would answer whether a token exists to anybody who tried one.
 */
export default async function SetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <AuthPanel>
      <h1 className="mt-[22px] text-[26px] leading-[1.06] font-extrabold tracking-[-0.035em] md:text-[30px]">
        Neues Passwort setzen
      </h1>
      <p className="mt-2.5 text-[15px] leading-relaxed font-medium text-tm">
        Danach wirst du direkt angemeldet.
      </p>

      <SetNewPasswordForm token={token} />
    </AuthPanel>
  );
}
