# Extrapolation

Jede Stelle, an der die Umsetzung von der Vorlage abweicht oder eine Lücke füllt,
die die Vorlage offenlässt — mit dem Grund und dem Screen, aus dem die
Entscheidung abgeleitet ist. Undokumentierte Abweichungen gelten als Fehler,
deshalb steht hier auch das Kleine.

Stand: Phase 0 bis 2. Die Liste wächst mit den weiteren Phasen.

---

## 1. Seiten, die die Vorlage nicht zeigt

Ursprünglich waren es drei. Mit der Nachlieferung von **13a** und **13b** ist das
Artikeldetail entworfen, also bleiben zwei.

### Datenschutz

Nicht entworfen. Gebaut wie das Impressum in **5c**: schmale Lesespalte, dieselbe
Kopf- und Fußzeile, dieselben Abschnittsüberschriften, derselbe Zeilenabstand.
Der Text liegt in `pages` und ist damit ohne Deploy änderbar — wie das Impressum,
das 5c ebenfalls als redaktionellen Inhalt behandelt.

Der Text ist inzwischen geschrieben, und zwar aus dem Verhalten der Anwendung
abgelesen statt aus einer Vorlage übernommen: kein Tracking und keine fremden
Hosts, das Farbschema im `localStorage` statt in einem Cookie, das
Kontaktformular ohne jede Speicherung in der Datenbank, die Ratenbremse nur im
Arbeitsspeicher und nur auf die Adresse, das eine Sitzungscookie, sowie IP und
Browserkennung in `velve.session` samt ihrer Fristen.

**Drei Angaben darin kann die Anwendung nicht belegen, weil sie dem Betrieb
gehören, und sie müssen vor dem Livegang zutreffen:** die Aufbewahrung der
Server-Protokolle von sieben Tagen (im Reverse Proxy einzustellen), ein
Auftragsverarbeitungsvertrag mit Resend samt Standardvertragsklauseln, und dass
der Objektspeicher tatsächlich in der EU steht.

### 404

Nicht entworfen. Kopf- und Fußzeile wie auf jeder öffentlichen Seite, ein Satz,
und zwei Wege zurück: Startseite und Archiv. Die beiden Ziele stehen so in der
Aufgabenstellung; die Gestaltung folgt der Lesespalte aus 5c.

---

## 2. Widersprüche zwischen Aufgabenstellung und Vorlage

Wo beide etwas sagen, entscheidet die Vorlage. Gemeldet statt still entschieden.

### Schrift

Die Aufgabenstellung nennt **IBM Plex Sans**. Alle 28 Screens setzen jedoch
`'Bricolage Grotesque','Inter Tight',system-ui`, und Slugs und Code stehen in
`JetBrains Mono`. IBM Plex Sans erscheint ausschließlich im Rahmen des
Entwurfsdokuments selbst — in der Werkzeugleiste und im `.dv-`-Gerüst —, in
keinem einzigen Screen.

→ Gebaut mit Bricolage Grotesque, Inter Tight und JetBrains Mono.

### Autorennamen als Verweis

Die Aufgabenstellung sagt, ein Autorenname sei ein Label und kein Verweis. Die
Vorlage verlinkt ihn (3a, Titelthema) und zeigt in 9a je Mitglied
„Alle Beiträge →". Zugleich führt die Vorlage „Autorenseite" in ihren
Weiter-Notizen als **noch nicht entworfen**.

→ Aufgelöst als Verweis ins **Archiv mit gesetztem Autorenfilter**. Es gibt keine
Autorenseite. Dasselbe gilt für Kategorie-Chips: sie führen ins Archiv, nicht auf
eine Kategorieseite.

### Cover-Anordnung

Die Aufgabenstellung führt in `cover` ein Feld `anordnung`, und eine frühere
Fassung der Vorlage hatte die Umschaltung „Wort im Hintergrund / Große Zeile".
Die aktuelle Fassung hat sie **entfernt**; es bleibt eine Anordnung.

→ `anordnung` entfällt im Datenmodell. `cover` hält `{ word, line, colorId, imageId? }`.

### Footer-Zeile

Die Aufgabenstellung schreibt „Built by Levo Studio — Konzept, Design und
Umsetzung". Die Vorlage schreibt „Built by Levo Studio" und darunter
„Konzept, Design und Umsetzung — danke an Julius.", mobil verkürzt auf
„Danke an Julius."

→ Wortlaut der Vorlage.

---

## 3. Widersprüche innerhalb der Vorlage

### Footer-Seitenabstand

**3a** sagt 44px. **5a**, **5b**, **5c**, **9a**, **10a** und **13a** sagen 40px.
3a widerspricht sich zudem selbst: sein Header nutzt 40px, sein Footer 44px.

→ 40px, weil es sechs Screens zu einem sind und zum Header passt.

### „Suche" in der Navigation

Die Aufgabenstellung führt „Suche" als Teil der Hauptnavigation. In der Vorlage
trägt sie nur **3a**; 5a, 5b, 5c, 9a, 10a und 13a haben sie nicht.

→ Nach Vorlage nur auf der Startseite. **Folge: vom Artikel aus ist die Suche
nicht erreichbar.** Offen für Entscheidung — mit einem Wort ändere ich es.

### Mobiler Header-Rahmen

**13b** zeichnet unter dem mobilen Header eine Linie, **4a** nicht; auf dem
Desktop haben beide eine.

→ Die Linie steht immer.

### Cover-Zeile auf dem 4:3-Cover

**4a** zeigt sie, **13b** lässt sie weg — bei gleichem Seitenverhältnis.

→ Wird gezeichnet, wenn eine Zeile vorliegt, mit den Werten aus 4a.

### Kategorie in der Freigabemail

**11b** schreibt „Politik & Gesellschaft", die Kategorienliste kennt nur
„Politik". 9a nutzt beide Schreibweisen für dasselbe Ressort.

→ Der Kategoriename aus der Datenbank, also „Politik".

---

## 4. Barrierefreiheit über die Vorlage hinweg

Die Abnahme verlangt WCAG AA in beiden Themes, rechnerisch geprüft. An zwei
Stellen kollidiert das mit der Vorlage. Beide Male ist die kleinstmögliche
Änderung gewählt.

### Weiß auf Akzent

Die Vorlage schreibt `color:#fff` auf `--ac`. Im hellen Theme sind das 7,16:1. Im
dunklen wird `--ac` zu `#a99bff`, und dasselbe Weiß misst **2,38:1** — auf der
aktiven Kategorie-Pille und auf dem Knopf, der auf Dunkel umschaltet. Die Vorlage
zeigt immer nur ein Theme, daher fällt es dort nicht auf.

→ `--s1` statt Weiß: 6,89:1 hell, 8,14:1 dunkel. Ein Token, beide Richtungen.

### Cover-Farbe „Oliv"

`#6b8f12` mit weißer Schrift misst **3,78:1** und ist der einzige der vierzehn
Einträge unter AA.

→ Die Fläche bleibt **unverändert**. Oliv bekommt die dunkle Tinte `#16180a`, die
die Vorlage bei Signalgelb ohnehin verwendet: 4,76:1.

`scripts/check-contrast.ts` rechnet alle vierzehn Verhältnisse und lässt die CI
unter 4,5:1 scheitern, damit die Zusicherung erzwungen ist statt nur behauptet.

### Raster auf dem Cover

Die Vorlage zeichnet das Raster als Weiß mit 14 % — richtig, solange jedes Cover
auf demselben dunklen Violett saß. Mit vierzehn Flächenfarben misst es gegen
Signalgelb 1,03:1 und gegen Bernstein 1,10:1, ist dort also unsichtbar.

→ Das Raster mischt aus der Tinte der jeweiligen Fläche, bei gleichen 14 %.

### Zielgrößen auf dem Touchscreen

Mobile Navigations- und Footer-Verweise messen in der Vorlage 27–29px Höhe. Die
Vorgabe verlangt mindestens 44×44px.

→ `min-h-11` nur auf Mobil; der Desktop bleibt exakt wie gezeichnet. Die
Unterstreichung des aktiven Eintrags sitzt auf einem inneren Element, damit sie
am Text klebt und nicht an den Rand der 44px-Fläche rutscht.

---

## 5. Was die Vorlage offenlässt

| Frage | Entscheidung | Abgeleitet aus |
|---|---|---|
| Wo steht der Theme-Umschalter? | Footer, zweite Zeile | Kein Screen zeigt einen; der Footer ist auf jeder Seite gleich |
| Wohin führt „Suche"? | `/archiv` | 5a ist der einzige Screen mit einem Suchfeld; eine eigene Suchseite gibt es nicht |
| Wohin führt „Menü" mobil? | Anker auf die Navigation | 4a zeigt „Menü" **neben** einer bereits sichtbaren Navigation. Eine echte Ausklapp-Steuerung kommt mit dem Header-Verhalten |
| Bruchpunkt Desktop/Mobil | 768px (`md`) | Die Vorlage gibt nur 375px und volle Breite |
| Ziele der Rechtsverweise | `/impressum`, `/datenschutz`, `/rss.xml` | — |
| Verweis auf Levo Studio | `https://levo-studio.com` | — |
| Verteilung der Cover-Farbe | Hash über den Titel, Avalanche-Stufe vor dem Modulo | Ohne sie liegen vier der zwölf echten Überschriften auf einer Farbe |
| „Weiterlesen" auf dem Artikel | Gleiche Kategorie zuerst, dann die neuesten | 13a zeigt zwei aus der eigenen Kategorie und einen fremden |

### Systemmails: was der Entwurf zeigt und was nicht

Die Mail-Karten in **11b**, **8b**, **12a** und **12b** sind Ausschnitte, keine
vollständigen Mails.

- Die Zeile „An alle Admins und …" samt fettem Betreff **gehört in die Mail**.
  Sie war zuerst als Mock-Kopf eines Mailprogramms gelesen und weggelassen
  worden, weil ein Postfach Empfänger und Betreff ohnehin anzeigt. Auf Ansage
  des Auftraggebers steht sie jetzt so in jeder Mail, wie der Entwurf sie
  zeichnet: 12px, fett, gedämpft, darunter der Betreff in 13,5px — getrennt
  durch eine Linie vom Rumpf. Wer angeschrieben ist, schreibt die Vorlage und
  nicht der Versand: „An alle Admins und …" ist ein Satz über die Nachricht.
- „Die Mail, die ankommt" bleibt draußen — das ist eine Beschriftung des
  Entwurfsdokuments, wie „Kein Passwort im Klartext …" in 8b.
- **Keine Wortmarke und keine Fußzeile.** Eine Weile trug die Mail beides, mit
  der Begründung, eine allein im Postfach liegende Mail müsse ihren Absender
  nennen. Der Entwurf zeichnet weder das eine noch das andere, und die
  Entscheidung ist zurückgenommen: es gilt, was gezeichnet ist.
- **Beide Farbschemata.** Die Karte, die Linien, der Knopf und die Faktenbox
  sind in hell und dunkel geprüft. Der Knopf hatte im Dunkeln seine Rundung
  verloren — die Dunkelregel malte den Hintergrund auch auf die Beschriftung und
  legte damit ein Rechteck über die runde Zelle darunter. Die Beschriftung
  bekommt dort jetzt nur noch ihre Farbe.
- Das freigegebene Meme sitzt **randbündig** zwischen Kopf und Rumpf, wie 11b es
  zeichnet, nicht als gerahmtes Bild im Text.
- **Vorschautexte** zeichnet der Entwurf nicht. Sie ergänzen, was der Betreff
  weglässt, statt ihn zu wiederholen.
- **Das Meme hat keinen Titel**, also nutzt seine Freigabemail den ausgeschriebenen
  Betreff aus 11b statt eines Titelmusters.
- „Du bekommst es persönlich von **ihr**." (12a) ist gegendert und aus einem Namen
  nicht ableitbar, also trägt der Prüfer sein Pronomen mit. Die Redaktion kennt
  daneben die Anrede **neutral**, die der Entwurf nicht zeichnet und für die kein
  deutsches Pronomen in diesem Satz sauber liest — dieser eine Fall schreibt
  deshalb den Namen. Die beiden gezeichneten Formen behalten den Wortlaut.

### Die Maße der Mails kommen aus dem Entwurf

Sie waren es zuerst nicht: gebaut standen 15px Fließtext gegen 14,5 im Entwurf,
13px Nebenzeile gegen 12,5, 18px Blockabstand gegen 14, ein Knopf mit 13/22 und
14px Schrift gegen 11/18 und 13,5. Einzeln unauffällig, zusammen eine andere
Mail. Nachgemessen und gleichgezogen:

| | Entwurf und jetzt gebaut |
|---|---|
| Fließtext | 14,5px / 1,65 / 500 |
| Nebenzeile | 12,5px / 1,6 / 500 |
| Blockabstand | 14px |
| Knopf | 11/18px, Radius 9px, 13,5px / 700 |
| Faktenbox | Innenrand 12/14px, Rahmen 10px, 13px / 1,7 / 600 |
| Ausgeschriebener Link | JetBrains Mono, 11,5px |
| Abschlusssatz | 12px Abstand, 12px über der Linie |

→ Die Beschriftungsspalte der Faktenbox ist je Screen anders breit — 74px beim
Artikel, 96px beim Meme, 110px bei der Passwortmeldung —, damit die Werte
untereinander stehen. Das ist eine Angabe des Entwurfs und keine Schätzung aus
der Textlänge, also gibt die Vorlage sie mit.

→ **Die Reihenfolge stand ebenfalls falsch.** Beim Passwortlink stand die
ausgeschriebene Adresse direkt unter dem Knopf; im Entwurf steht sie ganz unten,
nach dem Abschlusssatz. 12a hatte eine ausgeschriebene Adresse, die der Entwurf
gar nicht zeigt.

→ **„Kein Passwort im Klartext …" ist keine Mailzeile.** In 8b steht der Satz
**unter** der Mailkarte, in derselben Position und demselben Grau wie „Die
E-Mail, die ankommt" — eine Anmerkung des Entwurfsdokuments über das Verfahren.
Er wird nicht mehr in die Mail gerendert. Die Textfassung behält die Adresse,
weil eine Nur-Text-Mail keinen Knopf hat, der sie tragen könnte.

→ Bleibt abweichend, und zwar bewusst: **Kopf- und Fußzeile**. Der Entwurf
zeichnet die Mail im Rahmen eines Mailprogramms, das Absender und Betreff schon
anzeigt; eine Mail, die allein im Postfach liegt, muss beides selbst sagen. Das
steht so schon oben.

### Welche Systemmail tatsächlich verschickt wird

Die Vorlagen und der Resend-Versand waren beide gebaut und nie verbunden. An
`lib/auth.ts` stand statt einer Übergabe ein Wurf mit dem Satz, `RESEND_API_KEY`
und `MAIL_FROM` hätten in dieser Umgebung keinen Wert — der Code hat die beiden
Schlüssel nie angesehen, der Satz war mit gesetztem Schlüssel genauso falsch wie
ohne. Die Folge war still: „Passwort vergessen" sagte „die Mail ist unterwegs",
`requestOwnReset` fing den Wurf ab und protokollierte ihn, und es ging nie etwas
raus.

→ `lib/auth-delivery.ts` ist die fehlende Übergabe. Sie wird aus `lib/auth.ts`
dynamisch geladen, und den Versender lädt sie selbst noch einmal dynamisch, damit
weder die Anmeldung noch diese Datei React und den Mail-Renderer mitschleppt,
solange nichts gesendet wird.

| Nachricht der Bibliothek | Was passiert |
|---|---|
| `password_reset` | Geht über Resend raus, Vorlage `passwordReset` |
| `request_for_unknown_address` | Geht **nicht** raus, und zwar absichtlich |
| `email_verification` | Wird beim Einlösen der Einladung abgefangen und im selben Aufruf verbraucht |
| `email_change`, `magic_link`, `sign_up_attempt_on_existing_account` | Keine Vorlage; der Fehler benennt die Art |

→ Die unbekannte Adresse bekommt nichts. Screen 12b verspricht, dass eine
Anfrage nicht verrät, ob es das Konto gibt — das hält nur, solange beide Zweige
gleich viel kosten, also darf dieser nicht werfen, während der andere sendet. Zu
schreiben wäre ohnehin nichts: kein Name zum Grüßen, kein Link, nichts zu tun.

→ **Noch nicht verdrahtet, obwohl die Vorlage da ist:** die Freigabemail aus
**11b** und die Benachrichtigung aus **12a**. Die Einladung ist bewusst keine
Mail, sondern ein Link, der im Backoffice genau einmal angezeigt wird.

→ Bei 12a fehlt eine Entscheidung, keine Verdrahtung: die Vorlage trägt das
Pronomen des Admins als `"ihr" | "ihm"`, und die Anrede der Redaktion kennt
daneben `neutral`. Was in dem Satz stehen soll, wenn ein Konto neutral geführt
wird, sagt der Entwurf nicht.

---

## 6. Abweichungen auf Ansage des Auftraggebers

Nicht aus der Vorlage abgeleitet, sondern ausdrücklich angewiesen — und der
Aufgabenstellung entgegenstehend, deshalb hier festgehalten.

### Bilder laufen über die Anwendung, nicht über einen Auslieferungs-Host

Die Aufgabenstellung beschreibt `cdn.levo-studio.com` als Auslieferungsdomain mit
`images.remotePatterns` in `next.config` und der Bild-URL aus `CDN_BASE_URL` plus
Objektschlüssel.

Tatsächlich ist dieser Host die **API des Objektspeichers**, und nichts im Bucket
ist öffentlich.

→ `CDN_BASE_URL` entfällt, es bleibt `S3_ENDPOINT`. `next.config` deklariert keine
`remotePatterns`; der Server liest das Objekt und liefert es aus eigener Herkunft.

### Kein presigned PUT aus dem Browser

Folgt zwingend aus dem Vorigen: eine vorsignierte URL enthält den Speicher-Host
im Klartext und landet damit im Browser.

→ Der Upload läuft durch die Anwendung. Prüfung von Rolle, Dateityp und Größe
bleibt server-seitig, wie ohnehin vorgesehen. Kosten: 8-MB-Dateien laufen durch
den Node-Prozess.

### Suchfeld im Archiv sucht beim Tippen, und der Fokus sitzt im Kasten

Die Vorlage zeigt auf Bildschirm 5a nur den Zustand *nach* einer Suche — wie
die Eingabe abgeschickt wird, sagt sie nicht. Der Kasten um das Feld
(`border:1px solid var(--bd)`, `border-radius:12px`, `padding:15px 18px`)
bleibt wie gezeichnet.

→ Die Suche läuft 180 ms nach dem letzten Anschlag als `router.replace` in die
Adresse. Das Formular bleibt ein echtes GET-Formular mit Absende-Schaltfläche:
ohne Skript verhält sich das Archiv wie zuvor, und die Adresse bleibt in beiden
Fällen der ganze Zustand der Seite. `replace` statt `push`, weil ein Wort sonst
so viele Einträge im Verlauf hinterlässt, wie es Buchstaben hat.

→ Der allgemeine Fokusring aus `globals.css` — 2 px Akzentfarbe, 3 px Abstand —
schwebte hier als zweite Umrandung um einen Kasten, der schon eine hat.
Angewiesen wurde, ihn loszuwerden. Statt ihn ersatzlos zu streichen, was
WCAG 2.4.7 verletzt hätte, färbt sich der Kasten selbst: 1 px Rahmen plus 1 px
Ring in der Akzentfarbe, also die 2 px Umfang, die SC 2.4.11 verlangt, bei
6,9:1 gegen die Seite im hellen und 8,1:1 im dunklen Schema.

### Zeile „Mittwochs, 7. Stunde, Raum 214" im Login entfernt

Bildschirm 7a setzt sie als dritte Zeile unten in das Markenfeld.

→ Auf Ansage entfernt. Mit nur noch zwei Kindern hätte `justify-between` den
Block auf den Boden gedrückt, deshalb sitzt er jetzt mittig in dem Raum, den
die Wortmarke übrig lässt — optisch dort, wo ihn die Vorlage zeigt.

### Sitzungscookie ohne `__Host-` und `Secure` in der Entwicklung

Die Aufgabenstellung sagt nichts über Cookie-Attribute; gesetzt war
`__Host-velve_session` mit `Secure`, wie es die Bibliothek selbst schreibt.

WebKit — also Safari — speichert ein solches Cookie über einfaches `http`
nicht, `localhost` eingeschlossen. Gemessen gegen beide Engines:

| Engine | `__Host-` + `Secure` | ohne beides |
|---|---|---|
| Chromium | angekommen | angekommen |
| WebKit | **verloren** | angekommen |

→ In der Entwicklung heißt das Cookie `velve_session` und trägt kein `Secure`.
Die Produktion läuft über https und behält beides: der Präfix bindet das Cookie
an genau diesen Host und Pfad und ist dort mehr wert als die Bequemlichkeit
hier. Gegengeprüft in WebKit, Anmeldung und zehn Navigationen.

### Kein eigenes Titelbild mehr

Die Vorlage sieht auf 3b ein eigenes Foto als Cover vor, das den erzeugten
Entwurf ersetzt.

→ Auf Ansage entfernt. Cover sind immer erzeugt: Farbe, Wort, Zeile, Karo. Es
war zum Zeitpunkt der Entfernung kein Artikel betroffen — kein einziger nutzte
ein eigenes Titelbild —, also ändert sich nichts Sichtbares. Mit weg sind der
Upload, das Alt-Textfeld des Covers, `cover.imageId` und die Cover-Hälfte der
Freigaberegel.

→ **Dabei kam ein Fehler ans Licht, der vorher unbemerkt war:** `imageAccess`
entschied die öffentliche Sichtbarkeit allein über `cover->>'imageId'`. Bilder
im Fließtext waren dort nicht vorgesehen und wären auf der öffentlichen Seite
nicht erreichbar gewesen. Die Regel fragt jetzt den Bildknoten im Dokument ab —
gezielt nach `type = 'image'` und dem genauen `src`, nicht als Textsuche, weil
eine im Absatz zufällig auftauchende Kennung sonst einen falschen Eigentümer
bestimmt hätte.

→ Der Alt-Text eines Bildes im Text steht im Dokumentknoten, nicht in der
Spalte `images.alt`. Diese Spalte gehört jetzt allein den Memes und den
Sponsorenlogos.

### Bilder im Text werden abgelegt, nicht adressiert

Die Vorlage zeigt für ein Bild im Fließtext ein Feld für die Adresse. Woher die
Adresse kommt, sagt sie nicht — und von Hand eintippen kann sie niemand, weil
nichts im Bucket öffentlich ist.

→ Beide Editoren nehmen eine Datei per Drag-and-drop oder Einfügen an, laden sie
über dieselbe Prüfung wie früher das Cover (JPG, PNG, WebP, höchstens 8 MB, und
die Maße müssen wirklich lesbar sein) und setzen die Adresse selbst. Der Knopf
„Bild" in der Werkzeugleiste entfällt.

→ Im Markdown-Feld bleibt es Text — `![](/bild/…)`, an der Cursorstelle —, und
gerendert wird es nur in der Vorschau daneben. Im Rich Text steht das Bild
selbst, mit dem Alt-Text-Feld darunter, das rot bleibt, solange es leer ist.

### Abbildungen werden gezählt, nicht beschriftet

Nicht in der Vorlage. Auf Ansage: ein Bild trägt „Abbildung 2.1" — der zweite
Abschnitt, sein erstes Bild.

→ Die Nummer wird nirgends gespeichert, sondern aus der Position abgelesen:
jede H2-Überschrift beginnt einen Abschnitt, jedes Bild darin zählt weiter. Ein
verschobenes Bild oder eine neue Überschrift nummeriert alles darunter von
selbst um. Editor und veröffentlichter Artikel lesen dieselbe Funktion in
`lib/figures`, damit die beiden Beschriftungen nicht auseinanderlaufen können.

### Karo auf dem Titelbild ist eine Entscheidung

Die Vorlage zeichnet das Raster auf jedem erzeugten Cover, ohne es zur Wahl zu
stellen. Auf einem langen Cover-Wort konkurriert es mit der Schrift.

→ Ein Schalter im Cover-Reiter, gespeichert als `grid` im Cover-JSON. Fehlt das
Feld — also auf jeder Zeile, die vor dem Schalter geschrieben wurde —, gilt es
als an, was genau das ist, was diese Zeilen immer gezeichnet haben. Bei einem
eigenen Foto ist der Schalter gesperrt: ein Foto hatte nie ein Raster.

→ Die Vorschau im Editor zeigt seither die Variante `article` statt `card`. Die
Karte trägt laut Vorlage gar kein Raster, eine Vorschau darauf hätte den
Schalter also wirkungslos aussehen lassen.

### Eigene Kategorien aus dem Editor

Die Vorlage zeigt sechs feste Kategorien. Wer beim Schreiben merkt, dass keine
davon passt, hatte keinen Weg.

→ Ein Feld unter den Chips legt eine an und wählt sie sofort aus. Der Slug und
die Position in der Chipleiste werden abgeleitet, damit zwei Personen sich über
keines von beidem uneinig sein können; ein schon vergebener Name liefert die
vorhandene Zeile zurück statt einer zweiten daneben. Auf der Startseite taucht
sie auf, sobald der erste Artikel darin veröffentlicht ist.

### Beim Verlassen des Editors wird gesichert, nicht gefragt

Nicht in der Vorlage. Der Editor sichert von selbst, aber zwischen dem letzten
Anschlag und dem Speichern liegt eine Lücke, und wer in dieser Lücke geht,
verliert das Getippte.

→ Es stand zuerst eine Frage an dieser Stelle — „Ungesicherte Änderungen,
trotzdem verlassen?“. Sie ist entfernt worden, weil sie nichts entscheidet: wer
gerade eine Seite getippt hat, will sie behalten, und die Antwort war jedes Mal
dieselbe. Ein Klick auf einen Link im Backoffice lädt die Seite nicht neu, also
wird er abgefangen, der Artikel geschrieben und erst danach gewechselt. Die
Meldung oben rechts sagt, dass es passiert ist.

→ Abgefangen wird nur, wenn wirklich etwas offen ist. Dafür zählt der Editor
die Änderungen und merkt sich den Stand, mit dem eine Sicherung losgeschickt
wurde: kommt sie zurück und hat sich der Zähler nicht bewegt, ist alles
gesichert und der Klick läuft ungebremst durch.

→ Das geschlossene Tab bekommt diese Behandlung nicht. Ein Browser gibt einem
Weggehenden keine Zeit mehr für eine Anfrage, und `beforeunload` dürfte nur
wieder fragen. Was dort noch auf dem Spiel steht, ist die Wartezeit der
Selbstsicherung von gut einer Sekunde — nicht mehr die Minuten, die eine Frage
abgedeckt hätte.

### „- " am Zeilenanfang macht eine Aufzählung

Die Vorlage zeigt einen Knopf „Liste" in der Werkzeugleiste.

→ Der Knopf ist weg. Eine Zeile, die mit „- " oder „* " beginnt, wird zum
Aufzählungspunkt, und das Zeichen wird aus dem Text genommen — sonst stünde es
später als echter Bindestrich im Listenpunkt. Geprüft wird der Text, nicht die
Auszeichnung: ein Bindestrich in fetter Schrift öffnet die Liste ebenso, einer
weiter hinten in der Zeile nicht.

### Links werden erkannt statt eingetragen

Die Vorlage zeigt einen Link-Knopf in der Werkzeugleiste. Dahinter stand ein
`window.prompt`.

→ Der Knopf ist weg. Eine eingefügte Adresse wird zum Link, im Rich Text wie in
Markdown, nach derselben Regel: nur `http` und `https`, und der abschließende
Satzpunkt bleibt Text. Was ein `href` sein darf, entscheidet weiterhin
`htmlToInline`.

### Kein Suche-Knopf im Kopf

Die Vorlage setzt rechts in die Kopfzeile eine Pille „Suche", die auf das
Archiv zeigt.

→ Sie ist entfernt. „Archiv" steht ohnehin in der Navigation, und das Suchfeld
steht dort; ein zweites Bedienelement auf dieselbe Seite hat nur mit dem ersten
konkurriert.

### Kategorieleiste aus der Kopfzeile entfernt

Die Vorlage setzt unter die Navigation eine Reihe Kategorie-Pillen.

→ Auf Ansage entfernt. Erreichbar bleiben die Kategorien über den Filter im
Archiv und über die Kategorie-Pille am Artikel, die beide in dasselbe gefilterte
Archiv führen. Die Abfrage dahinter — nur Kategorien, in denen etwas
veröffentlicht ist — bedient jetzt allein den Archivfilter; sie hielt schon
vorher Pillen fern, die in ein leeres Archiv geführt hätten.

### „Mitschreiben" auf der Startseite kommt aus der Redaktionsseite

Die Vorlage zeichnet den Kasten auf 3a mit eigenem Text und den auf 9a mit
seinem — zweimal dieselbe Einladung, zweimal eigenständig gesetzt.

→ Beide lesen jetzt denselben Absatz aus der Zeile `pages.redaktion`. Vorher
stand der Text der Startseite im Code: eine geänderte Uhrzeit hätte an zwei
Stellen gepflegt werden müssen und wäre an einer stehen geblieben.

### „Art der Unterstützung" entfernt

Die Vorlage sieht auf 6a vier Arten vor — Druckkosten, Material, Technik,
Förderverein — und zeigt sie auf 6b unter jedem Namen.

→ Auf Ansage ganz entfernt: nicht mehr abgefragt, nicht mehr angezeigt, nicht
mehr geschrieben. Die Spalte `sponsors.kind` bleibt vorerst und ist nur nicht
mehr `not null` (Migration 0007): das Löschen einer Spalte nimmt die vier
vorhandenen Werte mit, und das ist keine Entscheidung, die eine
Oberflächenänderung nebenbei treffen sollte.

→ In der Laufzeitspalte ist die Warnfarbe weg. „abgelaufen" sagt bereits, dass
der Zeitraum vorbei ist; ihn zusätzlich rot zu setzen ließ die halbe Spalte wie
einen Fehler aussehen, wo keiner ist.

### Die Anmeldesperre zählt das Konto, nicht die Adresse

Bildschirm 7b sagt: drei Fehlversuche, dann drei Minuten Pause, und nennt dabei
die IP-Adresse.

So war es auch gebaut — und damit falsch, denn `rateLimit` ist die Einstellung
der **Instanz** und ersetzt den Vorgabewert für **jede** Route. Die Kontoseite
ruft `session.list` auf: ein viertes Neuladen innerhalb von drei Minuten wurde
abgewiesen. Das Einlösen einer Einladung (`signUp.withPassword`) ebenso. Und in
einem Schulnetz, wo alle dieselbe Adresse haben, hätten sich drei Versuche auf
die ganze Schule verteilt.

→ Der Adresszähler behält die Vorgabe der Bibliothek — ein Schutz gegen Fluten,
keine Sperre. Die drei Versuche sitzen auf dem Kontozähler, den eine Route
verbraucht, sobald sie weiß, welches Konto probiert wird. Das ist auch, worum
es dem Satz auf 7b eigentlich geht: jemand, der ein Konto errät. Die Meldung
auf dem Bildschirm sagt jetzt „dieses Konto" statt „deine IP-Adresse".

### Geräteliste nur kurz nach der Anmeldung

Nicht in der Vorlage. `session.list` verlangt eine frische Sitzung — fünfzehn
Minuten, gemessen ab der Anmeldung, und nur eine neue Anmeldung stellt sie
wieder her. Aufzulisten, wo jemand überall angemeldet ist, soll ein geliehener
Browser-Tab nicht können.

→ Die Seite verschluckte die Abweisung und zeigte eine Begründung, die nicht
stimmte (sie sprach von der Ratensperre). Jetzt wird der Code `freshness_required`
erkannt und benannt: „Die Geräteliste wird nur in den ersten fünfzehn Minuten
nach einer Anmeldung gezeigt." Profil und Passwortformular bleiben nutzbar.

→ Der `log`-Haken schreibt außerdem auf den Kanal, der zur Stufe passt. Eine
abgewiesene Anfrage ist eine Warnung; sie als Fehler zu drucken legte eine rote
Fehlerüberlagerung über etwas, das genau so gedacht ist.

### Was im Backoffice geändert wird, steht sofort auf der Seite

Die öffentlichen Seiten werden einmal gerendert und fünf Minuten lang aus dem
Zwischenspeicher bedient — richtig für Lesende, falsch für die Person, die
gerade etwas geändert hat und nachsehen geht. Die Aktionen frischten nur ihre
eigene Backoffice-Seite auf.

→ `lib/refresh.ts` benennt an einer Stelle, welche öffentlichen Seiten eine
Änderung erreicht: ein Unterstützer die Startseite, ein Meme die Meme-Seite,
ein Artikel vier Seiten und zwei Feeds, eine Personenänderung Start-,
Redaktions- und Kontaktseite. Jede Freigabe, jede Ablehnung und jede Änderung
ruft das auf.

### Eigene Artikel in der Liste erkennbar

Die Vorlage zeigt auf 7c eine Autorenspalte mit Namen. Wer die Liste liest, um
die eigene Arbeit zu finden, liest dabei den eigenen Namen unter vielen.

→ Die Zeile sagt „Du" statt des Namens, den die lesende Person ohnehin kennt,
und sagt es in der Akzentfarbe — der einzigen in dieser Spalte. Dazu eine Pille
„Von mir", die auf die eigenen Artikel filtert und sich mit dem Statusfilter
kombinieren lässt.

→ Die Pille erscheint nur, wo es etwas zu unterscheiden gibt: ein Autor sieht
ohnehin nur eigene Artikel, dort sagte sie dasselbe zweimal. „Alle" setzt beide
Filter zurück und leuchtet nur, wenn keiner gesetzt ist — zwei gleichzeitig
aktive Pillen in einer Reihe lesen sich wie zwei Antworten auf eine Frage.

### Meldungen oben rechts, mit ablaufendem Balken

Nicht in der Vorlage: sie zeigt Erfolge als Zeile im Formular, wo sie nur sieht,
wer ohnehin hinschaut.

→ Ein Stapel rechts oben, wie man ihn kennt. Jede Meldung trägt einen Balken,
der ihre Zeit abläuft — als `transform`, damit er nur zusammengesetzt und die
Seite nie neu gelegt wird, und mit der Dauer als CSS-Eigenschaft aus dem
Bauteil, weil eine zweimal geschriebene Zahl eine Zahl ist, die sich
widerspricht. Wer keine Bewegung will, bekommt keinen Balken: flachgerechnet
stünde er leer da und sagte etwas Falsches.

→ Die Zustellung ist eine Liste von Zuhörern auf Modulebene, kein Kontext. Die
Aufrufer sind verstreut — ein Knopf im Editor, ein Formular bei den
Unterstützern, ein Dialog in der Nutzerliste — und keiner davon sollte sich
eine Funktion durch fünf Bauteile reichen lassen müssen, nur um „gespeichert"
zu sagen.

→ Angeschlossen sind: Entwurf speichern, Veröffentlichen und Einreichen,
Freigeben und Ablehnen, Slug ändern, Kategorie anlegen, Bild einfügen,
Unterstützer speichern und löschen, Person entfernen, einladen, Passwort
ändern, Sitzungen beenden.

### Artikelfilter ohne „Anwenden"

Die Vorlage setzt einen Knopf neben Suche und Sortierung.

→ Beide wirken jetzt unmittelbar: die Suche 180 ms nach dem letzten Anschlag,
die Sortierung beim Wählen. Der Knopf stand nur zwischen den beiden. Er bleibt
als `sr-only`-Absender im Formular, damit die Liste ohne Skript weiter
funktioniert und die Adresse in beiden Fällen der ganze Zustand bleibt.

→ Das Wort „Sortieren“ neben einer Liste von Sortierungen sagt, was die
Liste schon sagt; es steht nur noch als zugänglicher Name auf der Auswahl, wo
es das einzige ist, das einem Screenreader mitteilt, wofür das Bedienelement
da ist.

→ Suchfeld und Auswahl haben jetzt dieselbe feste Höhe. Sie trugen dieselbe
Polsterung, aber zwei Schriftgrößen, und ein `select` bringt zusätzlich eine
eigene Höhe mit.

### Dialoge oben statt mittig

Mittig auf einer langen Seite heißt irgendwo im Text. Die Frage „ungesicherte
Änderungen" und der Slug-Dialog stehen jetzt am oberen Rand, wo der Blick
ohnehin hinfällt.

### Knopf „Als Entwurf speichern"

Nicht in der Vorlage: dort speichert nur die Autosave.

→ Der Knopf schreibt nichts, was die Autosave nicht ohnehin schriebe. Was er
ändert, ist das Wissen: wer eine Seite getippt hat und den Tab schließen will,
soll etwas drücken können und die Bestätigung sehen, statt einen Zeitstempel zu
lesen und zu hoffen. Gemessen: „Nicht gesichert" → Druck → „Autosave · 11:42".

→ Wer den Entwurf sieht, bleibt unverändert: die schreibende Person, dazu
Redakteur und Chefredaktion über `readOthersDrafts`. Für einen Autor ist ein
fremder Entwurf weiterhin weder sichtbar noch aufrufbar, wie 7c es verlangt.

### Fokus im Titelfeld als Unterstrich

Der Fokusring aus `globals.css` zog einen Kasten um eine Überschrift, was wie
ein Fehlerzustand aussieht. Ersatzlos streichen hieße, das Feld hätte gar
keinen sichtbaren Fokus mehr — ein Verstoß gegen WCAG 2.4.7.

→ Stattdessen ein Innenschatten: 2 px in der Akzentfarbe unter dem Text. Er
braucht keinen Platz, also verschiebt sich beim Erscheinen nichts, und er
erfüllt mit 6,9:1 im hellen und 8,1:1 im dunklen Schema die Anforderung an
einen Fokus-Indikator.

### Wer freigeben darf, reicht nichts ein

Die Vorlage zeigt auf 3b den Knopf „Zur Freigabe einreichen" für alle und auf
11a die Warteschlange dahinter.

→ Auf Ansage: nur ein **Autor** reicht ein. Redakteur und Chefredakteur
veröffentlichen unmittelbar — sie sind diejenigen, an die die Warteschlange
übergeben würde, und die eigene Arbeit einzureichen, um sie einen Bildschirm
später selbst freizugeben, ist Zeremonie, keine Prüfung. Gleiches gilt für
Memes und Unterstützer, und eine Änderung an einem veröffentlichten
Unterstützer schickt ihn nicht mehr in die Warteschlange zurück, wenn die
ändernde Person freigeben darf.

→ **Eine Regel gilt weiter für alle:** der Alt-Text. Ein Bild, das niemand
hören kann, ist nicht fertig, gleich wer den Artikel geschrieben hat — die
Prüfung, die eine Freigabe blockiert, blockiert jetzt auch das unmittelbare
Veröffentlichen, mit derselben Meldung.

→ Der Knopf heißt entsprechend: „Veröffentlichen" für die einen, „Zur Freigabe"
für die anderen.

### Vier Augen, solange es zwei gibt

Bildschirm 11a sagt: „niemand gibt die eigene Einreichung frei." So war es
gebaut — und in einer Installation mit einem einzigen Konto war damit gar
nichts veröffentlichbar. Der Unterstützer, den die einzige angemeldete Person
anlegt, der Artikel, den sie schreibt, das Meme, das sie hochlädt: alles ihres,
und niemand sonst darf es freigeben.

Genau so ist es passiert. Ein neuer Unterstützer blieb auf `review` stehen und
tauchte auf der Startseite nie auf — was wie ein Zwischenspeicherproblem
aussah, war diese Sperre.

→ Die Regel fragt jetzt die Lage statt sie anzunehmen: Gibt es eine **andere**
aktive Person mit Konto, die diese Freigabe erteilen dürfte? Wenn ja, bleibt es
bei der Abweisung. Wenn nein, ist die einreichende Person selbst die Prüfung.
Eine Regel, deren einzige Wirkung ein Stillstand ist, schützt niemanden.
Gemessen in beide Richtungen: allein — freigegeben; mit einem zweiten Konto —
`own_submission`.

### Jede Unterstützer-Zeile sagt, ob sie auf der Seite steht

Ob ein Eintrag öffentlich erscheint, hängt an vier Bedingungen: freigegeben,
aktiv, Zeitraum begonnen, Zeitraum nicht abgelaufen. Der Schalter beantwortet
davon eine. Mit vier Schaltern auf „an" und drei Unterstützern auf der
Startseite sah die Seite aus, als würde sie lügen — der Hinweis „wartet auf
Freigabe" stand klein und grau hinter der Adresse.

→ Unter jedem Namen steht jetzt eine Zeile mit Punkt: „auf der Startseite" in
der Akzentfarbe, sonst der Grund in Grau — wartet auf Freigabe, abgelehnt,
ausgeblendet, Zeitraum abgelaufen, Zeitraum beginnt später. Die Zahl oben
(„3 von 4 aktiv") zählte schon immer die, die wirklich erscheinen; jetzt kann
man sie auch Zeile für Zeile nachvollziehen.

### Unterstützer lassen sich wirklich löschen

Die Vorlage kennt auf 6a nur den Schalter, der einen Eintrag von der Seite
nimmt und den Datensatz behält.

→ Daneben steht jetzt „Löschen" mit Rückfrage im Seitendesign. Es ist für die
Zeile gedacht, die es nie hätte geben sollen — ein Tippfehler, ein Test, eine
geplatzte Zusage. Das Logo geht mit, in der Datenbank **und** im Objektspeicher:
ein Bild, das die Anwendung nicht mehr erreichen kann, entfernt sonst nie
jemand. `lib/storage.ts` hatte dafür bis jetzt gar keine Funktion.

### Abgelehnte Einreichungen bleiben stehen, mit Begründung

Die Vorlage zeigt auf 11a den Knopf „Ablehnen", sagt aber nicht, was danach mit
der Einreichung geschieht.

Gebaut war es so, dass Ablehnen beim Meme nur `visible` und beim Sponsor nur
`active` auf falsch setzte. Der Status blieb `review` — die Einreichung stand
also für immer in der Freigabeliste, und der Knopf sah aus, als täte er nichts.
Der Grund lag im Enum: `approval_status` kannte nur `review` und `published`,
eine abgelehnte Einreichung hatte **keinen Zustand, in den sie gehen konnte**.

→ Migration 0005 ergänzt `abgelehnt`, Migration 0006 eine Spalte
`rejection_reason` auf Artikeln, Memes und Sponsoren. Beides rein additiv.

→ **Gelöscht wird nichts.** Die Einreichung bleibt stehen und heißt „Abgelehnt";
daneben steht „Grund ansehen" und klappt den Text auf. Ein `<details>`, kein
immer offener Kasten: die Liste wird gelesen, um etwas zu finden, und ein
Absatz Kritik unter jeder abgelehnten Zeile hätte den Rest vom Bildschirm
geschoben.

→ **Die Begründung ist Pflicht.** Ablehnen öffnet erst ein Feld; ohne Text
bleibt „Senden" gesperrt, und der Server prüft es noch einmal, weil ein
gesperrter Knopf keine Regel ist. „Abgelehnt" allein sagt der einreichenden
Person, dass etwas nicht stimmt, und nichts darüber, was.

→ Beim Artikel heißt der Knopf weiterhin „Zurück" und der Artikel geht nach
`draft`: seine Autorin soll daran weiterarbeiten. Der Grund steht dann oben im
Editor, wo sie ihn beantwortet, und wird beim erneuten Einreichen gelöscht —
er beschrieb den Entwurf, der zurückkam, und nicht den, der nun da ist.

### Ausgeschiedene Personen: `ehemalig` statt Löschung

Die Vorlage kennt auf 11a nur eingeladen und aktiv und sagt nichts darüber, was
mit jemandem passiert, der geht. Die Fremdschlüssel sagten es für sie: Artikel
und Memes verweisen mit `restrict`, eine Löschung war also unmöglich, sobald
jemand einen Text geschrieben hatte.

→ Migration 0004 fügt dem Enum `user_status` den Wert `ehemalig` hinzu — rein
additiv. Entfernen gelingt jetzt immer, nur auf zwei Weisen: wer nichts
veröffentlicht hat, dessen Zeile verschwindet ganz; wer eine Byline trägt,
bleibt als `ehemalig` stehen, damit der Artikel einen Autor mit Namen behält.
Das Konto wird in beiden Fällen gelöscht, die Sitzungen enden damit.

→ Alles, was die Redaktion aufzählt, fragt nach `aktiv` und blendet die Person
damit von selbst aus: Redaktionsseite, Pillen auf der Startseite, Chefredaktion
auf der Kontaktseite. In der Nutzerliste steht sie unten, ohne Bedienelemente,
mit dem Vermerk „Artikel bleiben". In der Byline hängt ein kleines Schild
„Ehemalig" am Namen — in der kleinsten Schrift der Oberfläche und in `bd`, weil
es eine Fußnote zum Namen ist und keine Warnung davor.

→ Der Autorenfilter im Archiv führt sie weiter, denn ihre Artikel sind weiter
zu lesen; der Filter zählt Texte, nicht Mitgliedschaften.

### Redaktionsliste gedeckelt, Rest als Pille

Die Vorlage zeichnet auf der Startseite acht Namen und sagt nichts darüber, was
bei mehr passiert.

→ Ab der neunten Person steht neben den acht eine Pille „+ N weitere", die auf
`/redaktion` führt. Die Liste selbst — Startseite wie Redaktionsseite — kommt
aus der Mitgliedstabelle und nirgends sonst; eingeladene Personen stehen erst
darauf, wenn sie ihr Passwort gesetzt haben.

### Farbschema-Schalter im Kopf statt im Fuß

Die Vorlage setzt den Schalter in die Fußzeile, als Reihe aus drei
beschrifteten Feldern.

→ Er steht jetzt als einzelne Schaltfläche in der Kopfzeile und durchläuft
System, Hell, Dunkel; die Voreinstellung bleibt System. Die Fußzeile trägt ihn
nicht mehr.

### Artikeltext ohne Zeilenlängenbegrenzung

Die Vorlage setzt den Artikeltext auf eine Spalte von rund 68 Zeichen.

→ Auf der veröffentlichten Seite läuft der Text über die volle Spaltenbreite.
Im Editor bleibt die Begrenzung, weil eine schreibende Person ihre Absätze an
einer stabilen Zeilenlänge misst.

---

## 7. Technische Abweichungen

### Next.js 15 statt der Vorgabe von `create-next-app`

`create-next-app` installiert inzwischen 16. Die Aufgabenstellung nennt 15
verbindlich, daher ist 15.5.25 gepinnt. Nebeneffekt: 16 schreibt bei jedem
`next dev` eine `AGENTS.md` ins Repository, die damit entfällt.

### Schriften in einer Datei je Familie

Google liefert die Subsets getrennt nach Unicode-Bereich, und `next/font/local`
kann keine `unicode-range` je Quelldatei. Mit den fertigen Subsets hätte ein
türkischer oder polnischer Name mitten im Wort die Schrift gewechselt.

→ Die Originale sind auf `latin` + `latin-ext` in je einer Datei subsettet. Die
SIL OFL liegt bei, wie sie es verlangt.

### Zeitzone im Container festgeschrieben

Artikel werden auf die Minute geplant. Alpine ignoriert `TZ` ohne `tzdata` und
fällt still auf UTC zurück, was jede geplante Veröffentlichung um ein bis zwei
Stunden verschöbe.

→ `tzdata` im Runtime-Stage, `TZ=Europe/Berlin`. Geprüft: der Container meldet CEST.

### „noreply" gilt dem Anzeigenamen, nicht der Adresse

Die Aufgabenstellung verbietet „kein `noreply` als **Absendername**". Das ist der
Anzeigename, nicht das Postfach. Eine verifizierte Versand-Subdomain hat
üblicherweise gar kein Postfach, ihre Adresse darf also `noreply@` lauten.

Die Prüfung war zunächst zu streng und wies jede Adresse ab, die „noreply"
enthält. Jetzt prüft sie den Anzeigenamen: `noreply@mail.voxaudax.de` ist
zulässig, `noreply <noreply@…>` und `No-Reply <post@…>` nicht.

→ Dazu setzt der Versand `Reply-To` auf `redaktion@voxaudax.de` — die Adresse,
die die Vorlage auf sechs Screens nennt. Damit erreicht eine Antwort einen
Menschen, ohne dass für die Versand-Subdomain ein Postfach nötig wird.

Empfehlenswert, aber nicht erzwungen: den Anzeigenamen mitgeben, also
`MAIL_FROM=Vox Audax Redaktion <noreply@mail.voxaudax.de>`. Sonst zeigt der
Posteingang die nackte Adresse.

---

## 8. Offen — braucht eine Entscheidung

- **„Suche" nur auf der Startseite?** Nach Vorlage ja; die Folge ist, dass die
  Suche vom Artikel aus nicht erreichbar ist.
- **`MAIL_FROM`** steht auf einer noreply-Adresse und wird vom Schema abgewiesen.
  Solange sie dort steht, startet die Anwendung nicht.
- **`.design/`** liegt lokal und ist nicht versioniert. Ein Commit wandert
  unumkehrbar in die Historie eines öffentlichen Repositorys.
- **Resend** ist ein US-Anbieter. Die globalen Regeln schließen Dienste aus, die
  Daten außerhalb der EU speichern; die Aufgabenstellung schreibt Resend
  ausdrücklich vor. Über das Kontaktformular laufen Namen und Nachrichten von
  Schülerinnen und Schülern.
