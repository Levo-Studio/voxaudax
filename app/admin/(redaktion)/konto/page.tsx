import { PANEL_CLASS, PANEL_HEADING_CLASS } from "@/components/admin/controls";
import { ProfileForm } from "@/app/admin/(redaktion)/konto/profile-form";
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
 * the caller's own account and nothing else — and only while the session is
 * fresh, which is fifteen minutes measured from the sign-in itself and
 * restored by nothing but a new one. Listing where somebody is signed in is
 * not a thing a borrowed tab should be able to do.
 *
 * So the refusal is caught and named rather than swallowed: the panel says
 * which of the two happened, and the profile and the password form stay
 * usable either way.
 */
type DeviceList =
  | { readonly kind: "list"; readonly sessions: Awaited<ReturnType<ReturnType<typeof velveAuth>["session"]["list"]>> }
  | { readonly kind: "stale" }
  | { readonly kind: "unavailable" };

const activeSessions = async (): Promise<DeviceList> => {
  const sessionToken = await readSessionToken();
  if (sessionToken === undefined) return { kind: "unavailable" };

  try {
    return {
      kind: "list",
      sessions: await velveAuth().session.list({
        sessionToken,
        ...(await callFields("render")),
      }),
    };
  } catch (cause) {
    const code = (cause as { code?: unknown }).code;
    return code === "freshness_required" ? { kind: "stale" } : { kind: "unavailable" };
  }
};

export default async function AccountPage() {
  const member = await requireMember({ allowForcedPasswordChange: true });
  const devices = await activeSessions();

  return (
    <>
      {/* The only page in the back office that had no heading at all. Every
          other one names itself in an `h1`, and a page that names itself
          nowhere leaves a screen reader announcing three panels with no word
          about what it landed on. */}
      <h1 className="mb-3.5 px-4 text-xl font-extrabold tracking-[-0.03em] md:mb-4 md:px-0">
        Konto
      </h1>

      <div className="grid items-start gap-5 md:grid-cols-2">
      <div className={PANEL_CLASS}>
        <div className={PANEL_HEADING_CLASS}>Profil</div>
        <ProfileForm
          member={{
            name: member.name,
            email: member.email,
            initials: member.initials,
            bio: member.bio,
            roleLabel: roleLabel(member.role, member.form),
          }}
        />
      </div>

      <div className="flex flex-col gap-5">
        <div className={PANEL_CLASS}>
          <div className={PANEL_HEADING_CLASS}>Passwort ändern</div>
          <ChangePasswordForm forced={member.mustChangePassword} />
        </div>

        <div className={PANEL_CLASS}>
          <div className={PANEL_HEADING_CLASS}>Angemeldete Geräte</div>

          {devices.kind === "stale" ? (
            <p className="px-5 py-3.5 text-[13px] leading-[1.55] font-medium text-tm">
              Die Geräteliste wird nur in den ersten fünfzehn Minuten nach einer Anmeldung
              gezeigt. Melde dich neu an, um zu sehen, wo du überall angemeldet bist.
            </p>
          ) : devices.kind === "unavailable" ? (
            <p className="px-5 py-3.5 text-[13px] font-medium text-tm">
              Die Geräteliste ließ sich gerade nicht abrufen.
            </p>
          ) : (
            devices.sessions.map((session) => (
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
    </>
  );
}
