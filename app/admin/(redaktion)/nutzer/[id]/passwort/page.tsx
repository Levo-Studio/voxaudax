import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, PANEL_CLASS, PANEL_HEADING_CLASS } from "@/components/admin/controls";
import { ResetPasswordForm } from "@/app/admin/(redaktion)/nutzer/[id]/passwort/reset-form";
import { requireCapability } from "@/lib/authorize";
import { findMemberById } from "@/lib/editorial/members";
import { roleLabel } from "@/lib/roles";

export const metadata = { title: "Passwort neu setzen · Vox Audax Redaktion" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireCapability("resetOthersPassword");
  const { id } = await params;

  const member = await findMemberById(id);
  if (member === null || member.id === admin.id || member.velveUserId === null) notFound();

  return (
    <div className="mx-auto max-w-[460px]">
      <Link href="/admin/nutzer" className="text-[12.5px] font-semibold text-tm no-underline hover:text-tx">
        ← Nutzer
      </Link>

      <div className={`${PANEL_CLASS} mt-3.5`}>
        <div className={PANEL_HEADING_CLASS}>Passwort neu setzen</div>
        <div className="flex items-center gap-3 px-5 pt-5">
          <Avatar initials={member.initials} size={40} tone="ink" />
          <span>
            <span className="block text-[15.5px] font-bold tracking-[-0.02em]">{member.name}</span>
            <span className="block text-xs font-semibold text-tm">
              {member.email} · {roleLabel(member.role, member.form)}
            </span>
          </span>
        </div>
        <ResetPasswordForm memberId={member.id} />
      </div>
    </div>
  );
}
