import { AuthPanel } from "@/components/admin/auth-panel";
import { RequestResetForm } from "@/app/admin/passwort-vergessen/request-form";

export const metadata = { title: "Passwort vergessen · Vox Audax Redaktion" };

export default function ForgotPasswordPage() {
  return (
    <AuthPanel>
      <h1 className="mt-[22px] text-[26px] leading-[1.06] font-extrabold tracking-[-0.035em] md:text-[30px]">
        Passwort vergessen
      </h1>
      <p className="mt-2.5 text-[15px] leading-relaxed font-medium text-tm">
        Gib deine Redaktions-Adresse ein. Wenn ein Konto existiert, schicken wir dir einen Link.
      </p>

      <RequestResetForm />
    </AuthPanel>
  );
}
