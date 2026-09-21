import { Avatar, FIELD_CLASS, LABEL_CLASS, PANEL_CLASS, PANEL_HEADING_CLASS, PRIMARY_BUTTON_CLASS } from "@/components/admin/controls";
import { saveProfileAction } from "@/app/admin/(redaktion)/konto/actions";
import { ChangePasswordForm } from "@/app/admin/(redaktion)/konto/change-password-form";
import {
  EndOtherSessionsButton,
  EndSessionButton,
} from "@/app/admin/(redaktion)/konto/session-forms";
import { velveAuth } from "@/lib/auth";
import { requireMember } from "@/lib/authorize";
import { roleLabel } from "@/lib/roles";
import { callFields, readSessionToken } from "@/lib/session";

export const metadata = { title: "Konto · Vox Audax Redaktion" };

const WHEN = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

/**
 * Screen 8c. The device list comes from `auth.session.list`, which answers for
 * the caller's own account and nothing else.
 *
 * That route spends an address rate-limit bucket, and this installation's
 * bucket is the one screen 7b states: three, refilling over three minutes. A
 * reader who reloads this page a fourth time inside those three minutes is
 * refused there — so the refusal becomes a line in the panel rather than a
 * failed page, and the profile and the password form stay usable.
 */
const activeSessions = async () => {
  const sessionToken = await readSessionToken();
  if (sessionToken === undefined) return null;

  try {
    return await velveAuth().session.list({
      sessionToken,
      ...(await callFields("render")),
    });
  } catch {
    return null;
  }
};

export default async function AccountPage() {
  const member = await requireMember({ allowForcedPasswordChange: true });
  const sessions = await activeSessions();

  return (
    <div className="grid items-start gap-5 md:grid-cols-2">
      <div className={PANEL_CLASS}>
        <div className={PANEL_HEADING_CLASS}>Profil</div>
        <form action={saveProfileAction} className="flex flex-col gap-3 px-5 py-[18px]">
          <div className="flex items-center gap-3.5">
            <Avatar initials={member.initials} size={52} />
            <span className="text-[13px] font-semibold text-tm">
              {roleLabel(member.role, member.form)}
            </span>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Anzeigename</span>
            <input name="name" defaultValue={member.name} required className={FIELD_CLASS} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>E-Mail</span>
            <input
              value={member.email}
              readOnly
              aria-describedby="email-note"
              className={`${FIELD_CLASS} text-tm`}
            />
          </label>
          <p id="email-note" className="m-0 text-[11.5px] font-medium text-tm">
            Die Adresse ist der Anmeldename. Sie ändert die Chefredaktion.
          </p>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Kurzbio für die Autorenseite</span>
            <textarea name="bio" rows={3} defaultValue={member.bio ?? ""} className={FIELD_CLASS} />
          </label>

          <button type="submit" className={`${PRIMARY_BUTTON_CLASS} self-start py-2.5`}>Speichern</button>
        </form>
      </div>

      <div className="flex flex-col gap-5">
        <div className={PANEL_CLASS}>
          <div className={PANEL_HEADING_CLASS}>Passwort ändern</div>
          <ChangePasswordForm forced={member.mustChangePassword} />
        </div>

        <div className={PANEL_CLASS}>
          <div className={PANEL_HEADING_CLASS}>Angemeldete Geräte</div>

          {sessions === null ? (
            <p className="px-5 py-3.5 text-[13px] font-medium text-tm">
              Die Geräteliste ließ sich gerade nicht abrufen. Sie zählt auf dieselbe Sperre wie
              die Anmeldung — drei Abrufe, dann drei Minuten Pause.
            </p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="flex items-center gap-3 border-b border-bd px-5 py-3.5 text-[13.5px] font-semibold">
                <span>{session.userAgent ?? "Unbekanntes Gerät"}</span>
                <span className="ml-auto flex items-center gap-3 text-xs font-semibold">
                  {session.isCurrent ? (
                    <span className="text-ac">Diese Sitzung</span>
                  ) : (
                    <>
                      <span className="text-tm">{WHEN.format(session.lastUsedAt)}</span>
                      <EndSessionButton sessionId={session.id} />
                    </>
                  )}
                </span>
              </div>
            ))
          )}

          <EndOtherSessionsButton />
        </div>
      </div>
    </div>
  );
}
