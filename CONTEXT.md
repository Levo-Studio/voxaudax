# Context

Für einen Agenten, der dieses Repository zum ersten Mal sieht. Wer das hier
gelesen hat, kann weiterarbeiten, ohne vorher alles zu durchsuchen.

**Sprache:** Der Code und seine Kommentare sind englisch, alle Dokumente und
jeder Text, den ein Mensch auf der Seite liest, sind deutsch. Das ist Absicht:
die Anwendung antwortet einer deutschen Schule, der Code antwortet den Werkzeugen.

---

## 1. Was das ist

**Vox Audax** ist die Schülerzeitung des Uhland-Gymnasiums in Tübingen, gebaut
von **Levo Studio** (die Firma heißt immer mit beiden Wörtern, nie „Levo"
allein). Eine öffentliche Zeitung und ein Backoffice, in dem Schülerinnen und
Schüler Artikel schreiben, einreichen und freigeben.

Ansprechpartner sind **Julius Grimm** (baut es) und **Daniel Schnurr** (Redaktion,
schickt Wünsche). Verantwortlich im Impressum ist **Jonathan Fischer**.

Das Repository ist **öffentlich**: <https://github.com/Levo-Studio/voxaudax>,
MIT-Lizenz. Eine Section auf der Startseite erklärt, warum.

---

## 2. Was zuerst zu lesen ist

In dieser Reihenfolge, das reicht für fast jede Aufgabe:

1. **`EXTRAPOLATION.md`** — das wichtigste Dokument im Repository. Rund 1700
   Zeilen Deutsch. Jede Stelle, an der die Umsetzung von der Designvorlage
   abweicht oder eine Lücke füllt, mit dem Grund. **Was dort begründet steht,
   ist eine Entscheidung und kein Fehler.** Wer etwas ändert, das dort
   beschrieben ist, macht eine getroffene Entscheidung rückgängig — und wer
   etwas Neues abweichen lässt, schreibt es dort hinein. Abschnitt 8 („Offen")
   listet, was noch entschieden werden muss.
2. **`README.md`** — Stack, Umgebungsvariablen, wie man startet, wie deployt
   wird und die beiden Schritte, die vor dem ersten Start von Hand laufen.
3. **`lib/roles.ts`** — wer was darf. Sieben Fähigkeiten, drei Rollen.
4. **`lib/queries.ts`** — jede öffentliche Leseabfrage steht dort und nirgends
   sonst.
5. **`lib/db/schema.ts`** — das Datenmodell.

Die **Designvorlage** liegt unter `.design/Vox Audax Richtungen.dc.html`, 28
Screens, **gitignored** (sie gehört dem Auftraggeber und darf nicht in die
Historie eines öffentlichen Repositorys wandern). Sie ist bindend. Screens
werden im Code als „3a", „11b", „12a" zitiert.

---

## 3. Stack und Struktur

Next.js 15 App Router · TypeScript strict · Tailwind v4 · React Server
Components · PostgreSQL über Drizzle · `@velve/auth` 1.1.0 · RustFS (S3) ·
Resend + react-email · selbst gehostete Schriften · `output: "standalone"` ·
pnpm · **Node 22** (in `.nvmrc` und `engines` festgelegt).

```
app/              Seiten. Öffentlich unter /, Backoffice unter /admin
components/       gemeinsame Bausteine; components/admin/ nur fürs Backoffice
lib/              alles ohne JSX
lib/editorial/    Schreibpfade: Artikel, Memes, Sponsoren, Einladungen, Mails
lib/mail/         fünf react-email-Vorlagen + der Rahmen
lib/checks/       was die detaillierte Health-Route prüft
drizzle/          Migrationen, dazu drizzle/rollback/ mit je einer Rücknahme
scripts/          Saatgut, Migrator, Kontrastprüfer, Mailvorschau
test/             Integrationstests — brauchen eine Datenbank
tests/            Unittests — brauchen keine
```

**Warum zwei Testordner:** `test/` läuft nur, wo eine Datenbank steht; `tests/`
läuft überall, auch in der CI. Deshalb prüft die CI nur `pnpm test:unit`.

---

## 4. Die Regeln, die hier gelten

Aus der globalen `CLAUDE.md` des Nutzers und aus diesem Projekt. Sie sind nicht
verhandelbar:

- **`.env` niemals lesen, öffnen, catten, grepen oder ausgeben.** Wo ein Wert
  gebraucht wird, geht die Datei über `--env-file` direkt an Node.
- **Keine Geheimnisse** in Code, Config, Commits oder Chat.
- **Migrationen nur additiv.** `DROP`, `TRUNCATE`, Spalten entfernen oder
  Typänderungen mit Datenverlust: vorher fragen. Jede Migration bekommt eine
  Rücknahme unter `drizzle/rollback/`.
- **Nie direkt auf `main` committen**, außer der Nutzer sagt es ausdrücklich.
  Sonst: Branch, PR, und erst mergen, wenn er es sagt.
- **Keine Claude-, Anthropic- oder KI-Erwähnung** in Commits, PRs oder
  Git-Metadaten. Commit-Botschaften sagen, *was* sich geändert hat und *warum*.
- **Conventional Commits:** `feat:`, `fix:`, `security:`, `design:`, `docs:`,
  `ci:`, `migration:`, `chore:` …
- **Jede Abweichung von der Vorlage gehört in `EXTRAPOLATION.md`**, auf Deutsch.

---

## 5. Wie man prüft

```sh
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm test             # 160 Tests: test/ (Datenbank) + tests/ (ohne)
pnpm check:contrast    # 41 Farbpaare gegen WCAG AA, rechnet auch Deckkraft mit
pnpm check:env         # .env.example gegen das Schema
pnpm mail:preview      # rendert sieben Fassungen aus fünf Vorlagen
pnpm dev               # Port 7896
```

**Nie `pnpm build` laufen lassen, während der Dev-Server läuft.** Beide
schreiben in dasselbe `.next/`, und danach findet der Dev-Server seine eigenen
Chunks nicht mehr. Erst den Server beenden, dann bauen.

**Den Container-Build so nachstellen**, wie GitHub ihn fährt — mit Platzhaltern
und einer toten Datenbank:

```sh
lsof -tnP -iTCP:7896 -sTCP:LISTEN | xargs -r kill
rm -rf .next
env -i PATH="$PATH" HOME="$HOME" NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 \
  DATABASE_URL="postgres://nobody:nothing@127.0.0.1:1/none" \
  S3_ENDPOINT="https://example.invalid" S3_ACCESS_KEY_ID=xxxxxxxxxxxxxxxx \
  S3_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  S3_BUCKET=placeholder S3_REGION=eu-central-1 S3_FORCE_PATH_STYLE=true \
  MAIL_TO_EDITORIAL="redaktion@voxaudax.de" \
  AUTH_SECRET="cGxhY2Vob2xkZXItb25seS1mb3ItdGhlLWJ1aWxkLTMyYnk" \
  HEALTH_TOKEN="placeholder-only-for-the-build-0123456789" \
  NEXT_PUBLIC_SITE_URL="https://voxaudax.de" TZ=Europe/Berlin \
  pnpm build
```

**Im Browser prüfen, nicht raten.** Playwright liegt unter
`node_modules/playwright`. Alles Sichtbare wurde hier bei 375/390px und 1280px
in hellem **und** dunklem Theme nachgesehen; Kontraste werden gerechnet, nicht
geschätzt.

---

## 6. Wie man Testdaten anlegt und wieder wegräumt

Es gibt keinen Testzugang mit bekanntem Passwort. Ein Probekonto entsteht so:

```ts
// scripts/tmp-probe.mts, danach löschen
import { db } from "@/lib/db/client";
import { issueInvitation, invitationPath } from "@/lib/editorial/invitations";
const chief = await db.query.users.findFirst({ where: (r, { eq }) => eq(r.role, "admin") });
const issued = await issueInvitation({
  invitedBy: chief as never, email: "probe@voxaudax.test", name: "Probe",
  initials: "PR", role: "admin", form: "neutral", hours: 24,
});
console.log(invitationPath(issued.token));
```

```sh
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --conditions=react-server \
  --import ./test/register-alias.mjs --env-file=.env scripts/tmp-probe.mts
```

Dann den Link im Browser öffnen, Passwort setzen — **das meldet direkt an**.

**Fallen, in die ich gelaufen bin:**

- Der Einladungslink gilt **einmal**. Scheitert das Skript nach dem Einlösen,
  ist er verbraucht; dann anmelden statt einlösen.
- Beim Einlösen wird die Rolle aus der Einladung neu gesetzt. Wer die Rolle
  vorher in der Datenbank hochsetzt, verliert das wieder.
- **Immer eine frische Adresse nehmen.** Die Ratenbremse zählt drei Fehlversuche
  je Konto und sperrt dann drei Minuten.
- **Mit leerem `TRUSTED_PROXIES` teilen sich alle Anrufer einen Topf** (10
  Anfragen, dann eine alle zehn Sekunden). Wer viel im Browser testet, sperrt
  sich selbst aus. Dann warten.

Am Ende aufräumen — erst die Einladungen, dann die Konten, sonst hält ein
Fremdschlüssel dagegen:

```sql
delete from invitations where invited_by in (select id from users where email like '%@voxaudax.test') or email like '%@voxaudax.test';
delete from velve."user" where email like '%@voxaudax.test';
delete from public.users where email like '%@voxaudax.test';
```

**Der Sollzustand der Entwicklungsdatenbank:** 8 Personen (Julius aktiv, Daniel
eingeladen, sechs ehemalige aus dem Saatgut), 12 veröffentlichte Artikel, 4
Unterstützer. Nach jedem Test wieder dorthin zurück.

---

## 7. Was man wissen muss, bevor man etwas anfasst

### Sichtbarkeit und Rechte

`lib/roles.ts` hat sieben Fähigkeiten und drei Rollen — `autor`, `redakteur`,
`admin`. Die Bezeichnung von `admin` ist seit Kurzem **Redaktionsleitung** (der
interne Begriff der Redaktion, geschlechtsneutral, deshalb für alle drei
Anredeformen gleich).

Jede Server Action beginnt mit `requireMember()` oder
`requireCapability(...)`. `test/gate-coverage.test.mts` prüft, dass keine
vergessen wurde.

**„Veröffentlicht" heißt zweierlei:** der Status steht auf veröffentlicht *und*
der Zeitpunkt ist erreicht. Ein Artikel mit einem Datum in der Zukunft trägt den
Status schon und ist bis dahin für niemanden zu sehen. Die Abfrage dafür heißt
`live()` in `lib/queries.ts`.

### Bilder

`/bild/[id]` ist die Adresse, die **jede** Seite schreibt. Was gelesen werden
darf, entscheidet `lib/editorial/images.ts` und nichts anderes. Ein Bild in
einem Artikeltext gehört dem Artikel, der es nennt — gefunden über eine
Containment-Abfrage auf `articles.body`, die `articles_body_idx` beantwortet.

Ein Bild, das aus einem Text verschwindet, wird **markiert, nicht sofort
gelöscht** (`images.detached_at`), und nach einem Tag gekehrt. Der Grund steht
in `lib/editorial/detached-images.ts`: der Editor sichert eine Sekunde nach dem
letzten Anschlag, und ein Rückgängig fände sonst nichts mehr.

### Mails

Fünf Vorlagen unter `lib/mail/templates/`, aus denen sieben Fassungen
entstehen: die Freigabe zeichnet Artikel und Meme, die Einladung 24 Stunden und
7 Tage. Sie werden aus
`lib/editorial/announce.ts` und `lib/auth-delivery.ts` verschickt. **Nichts
davon wirft:** eine Einladung, die nicht ankam, ist immer noch eine Einladung.
`pnpm mail:preview` rendert alle sieben Fassungen ohne Schlüssel.

Die Maße stehen im Entwurf und sind nachgemessen: 14,5px Fließtext, 12,5px
Nebenzeile, 14px Blockabstand, Knopf 11/18px. Die Mail trägt ihren eigenen Kopf
(„An … / Betreff") und **keine** Wortmarke und keine Fußzeile.

### Rendern

Jede öffentliche Seite trägt `dynamic = "force-dynamic"` und streamt: Kopf, Fuß
und Überschriften in der ersten Antwort, die Abfrage folgt in ein Skelett
(`components/skeleton.tsx`). **Der Grund ist ein echter Fehler gewesen:**
vorgerendert wurde im Container, der keine Datenbank erreicht, also war der
Leerzustand eingebacken.

Die Artikelseite streamt **nicht** als Ganzes — ein unbekannter Slug antwortet
404, ein alter leitet um, und beides geht nach dem ersten ausgelieferten Byte
nicht mehr.

`orNoneAtBuildTime` in `lib/queries.ts` fängt **nur während des Baus**. Zur
Laufzeit schlägt ein Fehler zu `app/error.tsx` durch, statt als leere Zeitung zu
erscheinen.

### Zahlen an einer Stelle

`lib/limits.ts` hält, wie viel wo erscheint: Startseite 10, Archivseite 20 mit
„Mehr laden", Obergrenze 500, Feed 20, Weiterlesen 3, Redaktionspillen 8, Memes
48. Die Erklärkachel im Backoffice liest dieselbe Datei — zweimal getippt liefen
die Zahlen auseinander.

### Die Ratenbremse

`X-Forwarded-For` wird **nur geglaubt, wenn `TRUSTED_PROXIES` sagt, wer ihn
schreiben darf** (`lib/client-address.ts`). Leer heißt: nichts wird geglaubt und
alle teilen einen Topf. Die Drei-Versuche-Sperre hängt am **Konto**, nicht an
der Adresse, und gilt immer.

---

## 8. Deployment

Push auf `main` → GitHub Actions baut das Image, schiebt es nach GHCR,
**verifiziert**, dass es dort liegt, und ruft erst dann den Dokploy-Webhook.

```
ghcr.io/levo-studio/voxaudax:latest
ghcr.io/levo-studio/voxaudax:sha-<voller Commit>
```

Kleinschreibung ist Pflicht. Port **7896**, Healthcheck `/api/health`.

**Das Image enthält weder `scripts/` noch `drizzle/`.** Ein Container bewegt das
Schema also nie von selbst — Absicht. Vor dem ersten Deploy und bei jeder neuen
Migration, aus einem Checkout, dessen `DATABASE_URL` auf die Produktion zeigt:

```sh
pnpm db:migrate
pnpm admin:bootstrap --email … --name "…" --form …
```

`admin:bootstrap` legt das einzige Konto an, das nicht übers Backoffice
entsteht, und druckt einen Einmal-Link. Es weigert sich, sobald ein Konto
existiert.

---

## 9. Was gerade offen ist

Stand: **26. September 2026**. Abschnitt 8 von `EXTRAPOLATION.md` ist die
gepflegte Liste; das hier sind die Punkte, die jemanden betreffen, der
weitermacht:

- **`TRUSTED_PROXIES` ist in der Produktion nicht gesetzt.** Bis dahin zählt die
  Bremse alle Leser als einen Anrufer. Es braucht Traefiks CIDR-Bereich — eine
  Angabe aus dem Betrieb, die die Anwendung sich nicht selbst holen kann.
- **Die Domain.** `voxaudax.de` zeigt noch auf eine alte Flask-Anwendung; das
  Neue läuft unter `new.voxaudax.de`. Solange `NEXT_PUBLIC_SITE_URL` nicht auf
  die Adresse zeigt, unter der jemand die Seite aufruft, **weist die Bibliothek
  jede Anmeldung ab, bevor sie das Passwort ansieht** — und der Schirm zeigt
  dafür denselben Satz wie für ein falsches Passwort. Das ist die häufigste
  Ursache für „der Login tut nicht".
- **Die CI ruft keine dynamische Route ab.** `pnpm build` rendert eine
  dynamische Route nie, und das sind inzwischen fast alle. Es fehlt ein
  Rauchtest, der die Seiten wirklich abruft — dafür braucht der Runner eine
  Datenbank.
- **Der Datenschutztext ist juristisch ungeprüft**, und drei Betriebszusagen
  darin müssen zutreffend gemacht werden: Protokolle nach sieben Tagen löschen,
  AV-Vertrag mit Resend, Objektspeicher in der EU.
- **Resend ist ein US-Anbieter.** Die Hausregeln schließen Dienste aus, die
  Daten außerhalb der EU speichern; die Aufgabenstellung schreibt Resend
  ausdrücklich vor. Über das Kontaktformular laufen Namen von Schülerinnen und
  Schülern.
- **Das Impressum steht in der Datenbank**, nicht im Code (Tabelle `pages`). Die
  Entwicklungsdatenbank nennt Jonathan Fischer; falls die Produktion eine eigene
  Datenbank hat, steht dort noch der alte Text.

---

## 10. Woran ich mich verbrannt habe

Damit es niemand ein zweites Mal tut:

- **`pnpm build` bei laufendem Dev-Server** zerlegt dessen `.next/`. Erst
  beenden.
- **`git add -A` nimmt Finder-Dubletten mit.** macOS legt „name 2.ts" neben
  „name.ts", sechs davon sind so bis in `main` gelangt. Der Check-Job lehnt so
  benannte Dateien jetzt ab (Schritt „No duplicated files"). Und: **vergleichen,
  bevor man löscht** — ich habe eine weggeworfen und erst danach nachgesehen,
  was drinstand.
- **`[skip ci]` in der Commit-Botschaft** lässt GitHub den Workflow aus. Nützlich
  für reine Dokumentation; mit `gh workflow run deploy.yml --ref main` löst man
  ihn später von Hand aus.
- **Node 26 lokal gegen Node 22 in der CI.** `node --test tests/` — ein
  Verzeichnis als Argument — läuft auf 26 und scheitert auf 22. Deshalb `.nvmrc`
  und `engines`.
- **Tests, die gegen eine gemeinsame Datenbank parallel laufen**, dürfen nichts
  gegen eine vorher gelesene Gesamtzahl prüfen: eine andere Datei veröffentlicht
  dazwischen. Eigenschaften prüfen, nicht Gleichheit mit einem zweiten Abruf.
- **Fehler nicht stumm verschlucken.** Mehrfach stand hier ein `catch`, der
  einem Leser „nichts veröffentlicht" zeigte, während in Wahrheit die Datenbank
  weg war.
- **Nicht raten, messen.** Ich habe hier behauptet, `renderMail` könne in einer
  Server Action nicht laufen — in Next lief es einwandfrei; falsch war mein
  Node-Aufruf. Und ich habe eine Fehlermeldung über `RESEND_API_KEY` als
  Messergebnis weitergegeben, obwohl sie frei erfunden im Quelltext stand.

---

## 11. Wie hier gearbeitet wird

Julius schreibt kurz, oft mit Tippfehlern, und erwartet, dass man die Absicht
versteht statt nachzufragen. Er testet sofort auf dem Telefon und schickt
Screenshots. Was er sagt, gilt — auch wenn es der Designvorlage widerspricht;
dann kommt es nach `EXTRAPOLATION.md`.

Der übliche Ablauf: Branch, bauen, **im Browser nachmessen**, alle Prüfungen,
`EXTRAPOLATION.md` nachziehen, PR mit einer Beschreibung, die sagt *was* und
*warum* und *wie geprüft*, und dann nur die URL in den Chat. Er antwortet
„merged", und dann: zurück auf `main`, Branch löschen, Deploy beobachten.

**Er will am Ende nur `main` sehen.** Keine alten Branches.
