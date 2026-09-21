import Link from "next/link";

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
    <main className="mx-auto max-w-[470px] px-4 py-10 md:px-9">
      <Link href="/admin" className="flex items-baseline gap-[9px] no-underline">
        <span className="text-[19px] font-extrabold tracking-[-0.04em] text-ac">VOX AUDAX</span>
        <span className="text-[11px] font-bold tracking-[0.14em] text-tm uppercase">Redaktion</span>
      </Link>

      <h1 className="mt-5 text-[26px] leading-[1.06] font-extrabold tracking-[-0.035em] md:text-[30px]">
        Neues Passwort setzen
      </h1>
      <p className="mt-2.5 max-w-[42ch] text-[15px] leading-relaxed font-medium text-tm">
        Danach wirst du direkt angemeldet.
      </p>

      <SetNewPasswordForm token={token} />
    </main>
  );
}
