import Link from "next/link";

import { RequestResetForm } from "@/app/admin/passwort-vergessen/request-form";

export const metadata = { title: "Passwort vergessen · Vox Audax Redaktion" };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-[460px] px-4 py-10 md:px-9">
      <Link href="/admin" className="flex items-baseline gap-[9px] no-underline">
        <span className="text-[19px] font-extrabold tracking-[-0.04em] text-ac">VOX AUDAX</span>
        <span className="text-[11px] font-bold tracking-[0.14em] text-tm uppercase">Redaktion</span>
      </Link>

      <h1 className="mt-5 text-[26px] leading-[1.06] font-extrabold tracking-[-0.035em] md:text-[30px]">
        Passwort vergessen
      </h1>
      <p className="mt-2.5 max-w-[42ch] text-[15px] leading-relaxed font-medium text-tm">
        Gib deine Redaktions-Adresse ein. Wenn ein Konto existiert, schicken wir dir einen Link.
      </p>

      <RequestResetForm />
    </main>
  );
}
