import { redirect } from "next/navigation";

import { BrandPanel } from "@/components/admin/brand-panel";
import { LoginForm } from "@/app/admin/login-form";
import { currentMember } from "@/lib/authorize";

export const metadata = { title: "Anmelden · Vox Audax Redaktion" };

/**
 * Screen 7a. There is no registration here and no link to one: an account comes
 * into existence behind an admin's invitation and the library's own `/sign-up`
 * answers 404.
 */
export default async function AdminLoginPage() {
  if ((await currentMember()) !== null) redirect("/admin/artikel");

  return (
    <div className="grid min-h-dvh bg-s1 text-tx md:grid-cols-[1.1fr_1fr]">
      <BrandPanel>
        <p className="mt-4 max-w-[36ch] text-[15px] leading-relaxed font-medium opacity-90 md:text-[17px]">
          Artikel schreiben, bebildern und veröffentlichen. Zugang bekommt, wer in der
          Redaktion mitarbeitet.
        </p>
      </BrandPanel>
      <LoginForm />
    </div>
  );
}
