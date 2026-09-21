import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, LABEL_CLASS, PANEL_CLASS, PANEL_HEADING_CLASS, PRIMARY_BUTTON_CLASS } from "@/components/admin/controls";
import { changeRoleAction } from "@/app/admin/(redaktion)/nutzer/actions";
import { requireCapability } from "@/lib/authorize";
import { findMemberById } from "@/lib/editorial/members";
import { FORM_LABELS, ROLE_HINTS, roleLabel, type Form, type Role } from "@/lib/roles";

export const metadata = { title: "Person bearbeiten · Vox Audax Redaktion" };

const ROLES: readonly Role[] = ["autor", "redakteur", "admin"];
const FORMS: readonly Form[] = ["weiblich", "maennlich", "neutral"];

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireCapability("manageUsers");
  const { id } = await params;

  const member = await findMemberById(id);
  if (member === null || member.id === admin.id) notFound();

  return (
    <div className="mx-auto max-w-[560px]">
      <Link href="/admin/nutzer" className="text-[12.5px] font-semibold text-tm no-underline hover:text-tx">
        ← Nutzer
      </Link>

      <div className={`${PANEL_CLASS} mt-3.5`}>
        <div className={PANEL_HEADING_CLASS}>Person bearbeiten</div>
        <form action={changeRoleAction} className="flex flex-col gap-4 p-5">
          <input type="hidden" name="memberId" value={member.id} />

          <div className="flex items-center gap-3">
            <Avatar initials={member.initials} size={40} />
            <span>
              <span className="block text-[15.5px] font-bold tracking-[-0.02em]">{member.name}</span>
              <span className="block text-xs font-semibold text-tm">
                {member.email} · {roleLabel(member.role, member.form)}
              </span>
            </span>
          </div>

          <fieldset className="border-none p-0">
            <legend className={LABEL_CLASS}>Rolle</legend>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
              {ROLES.map((role) => (
                <label
                  key={role}
                  className={`cursor-pointer rounded-full px-[11px] py-2 ${
                    role === member.role ? "bg-ac text-s1" : "border border-bd text-tm"
                  }`}
                >
                  <input type="radio" name="role" value={role} defaultChecked={role === member.role} className="sr-only" />
                  {roleLabel(role, member.form)}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs font-medium text-tm">{ROLE_HINTS[member.role]}</p>
          </fieldset>

          <fieldset className="border-none p-0">
            <legend className={LABEL_CLASS}>Bezeichnung</legend>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
              {FORMS.map((form) => (
                <label
                  key={form}
                  className={`cursor-pointer rounded-full px-[11px] py-2 ${
                    form === member.form ? "bg-ac text-s1" : "border border-bd text-tm"
                  }`}
                >
                  <input type="radio" name="form" value={form} defaultChecked={form === member.form} className="sr-only" />
                  {FORM_LABELS[form]}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" className={`${PRIMARY_BUTTON_CLASS} self-start`}>Speichern</button>
        </form>
      </div>
    </div>
  );
}
