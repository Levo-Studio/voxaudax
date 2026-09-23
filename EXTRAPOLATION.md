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

Der Text stand bis jetzt nur hier beschrieben und nirgends im Repository: `PAGES`
in `scripts/seed-content.mts` kannte `impressum` und `redaktion`, und `pages`
wird sonst von nichts beschrieben, also zeigte `/datenschutz` dauerhaft den
Platzhalter. Diese Datei behauptete das Gegenteil — das war falsch und ist
hiermit berichtigt.

→ Der Text steht jetzt als dritter Eintrag in `PAGES` und kommt mit
`pnpm db:seed` in die Tabelle, genau wie Impressum und Redaktionsseite. Er ist
aus dem Verhalten der Anwendung abgelesen statt aus einer Vorlage übernommen:
kein Tracking und keine fremden Hosts, das Farbschema im `localStorage` statt in
einem Cookie, das Kontaktformular ohne jede Speicherung in der Datenbank, die
Ratenbremse nur im Arbeitsspeicher und nur auf die Adresse, das eine
Sitzungscookie, sowie die auf das Netz gekürzte IP-Adresse und die Browser- und
Systemfamilie in `velve.session` samt ihrer Fristen (sieben Tage ohne Nutzung,
spätestens 30 Tage — die Vorgaben von `@velve/auth`, die diese Anwendung nicht
überschreibt).

**Vier Angaben darin kann die Anwendung nicht belegen, weil sie dem Betrieb
gehören. Sie stehen im Text sichtbar als „Betriebszusage" und müssen vor dem
Livegang zutreffen:** die Aufbewahrung der Server-Protokolle von sieben Tagen
(im Reverse Proxy einzustellen), ein Auftragsverarbeitungsvertrag mit Resend
samt Standardvertragsklauseln, dass der Objektspeicher tatsächlich in der EU
steht, und dass die Server in der EU stehen. Die vierte kam dazu, weil eine
Erklärung, die den Betreiber als Empfänger nennt, auch sagen muss, wo er die
Daten hält.

**Der Wortlaut ist juristisch nicht geprüft.** Er beschreibt, was der Code tut;
ob er als Erklärung genügt, entscheidet nicht die Anwendung.

Der Platzhalter, den die Seite ohne Text zeigt, nennt jetzt den Betrieb und den
Seed. Vorher schickte er die Redaktion in eine Seitenverwaltung, die es im
Backoffice nicht gibt — `pages` hat dort keine Oberfläche —, und wies die
Aufgabe damit der Partei zu, die sie nicht erledigen kann.

### 404

Nicht entworfen. Kopf- und Fußzeile wie auf jeder öffentlichen Seite, ein Satz,
und zwei Wege zurück: Startseite und Archiv. Die beiden Ziele stehen so in der
Aufgabenstellung; die Gestaltung folgt der Lesespalte aus 5c.

### Fehlerseite

Ebenfalls nicht entworfen, und bis hierher gab es keine: Ohne eine Fehlergrenze
zeichnet Next.js seine eingebaute Seite — weiß, ungestaltet, englisch, ohne
Kopf- und Fußzeile und ohne Weg zurück. Das traf jeden Pfad, der zur Anfragezeit
gerendert wird, sobald die Datenbank nicht antwortete: `/archiv` und `/memes`
lesen `searchParams`, ein Artikel außerhalb des Prerenders ebenso.

→ Drei Grenzen, alle nach demselben Muster wie die 404-Seite:

- `app/error.tsx` für die öffentliche Seite, in der Lesespalte aus 5c, mit
  Kopf- und Fußzeile, „Noch einmal versuchen" und dem Weg zur Startseite.
- `app/admin/(redaktion)/error.tsx` für das Backoffice, als Panel innerhalb der
  Shell, damit die Navigation stehen bleibt.
- `app/global-error.tsx` als letzte Grenze. Sie ersetzt das Wurzel-Layout und
  hat deshalb weder `globals.css` noch Schrift noch Farbschema-Skript zur
  Verfügung; sie ist die einzige Seite des Projekts, die ihre paar Angaben
  selbst mitbringt.

Alle drei protokollieren den `digest` und zeigen ihn an, damit die Meldung im
Dokploy-Log wiederzufinden ist.

Eine Fehlergrenze rettet keinen ungesicherten Text: Sie ersetzt die Oberfläche
des Abschnitts, das Formular ist mit ihr fort. Der Editor fängt seine Sicherung
deshalb selbst ab (Abschnitt 6, „Beim Verlassen des Editors wird gesichert") und
bleibt mit dem Text stehen, statt in die Grenze zu laufen.

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

→ Der Filter adressiert die Person über den Namen, und zwei Namen können
denselben Slug ergeben — „Anna-Lena“ und „Anna Lena“ werden gleich geschrieben,
und zwei Mitglieder können schlicht gleich heißen. Die zweite Person bekommt in
diesem Fall ein angehängtes „-2“, vergeben in einer festen Reihenfolge (Name,
dann Id). Menü und Auflösung werden aus derselben Liste gebaut, damit beide
Seiten dieselbe Antwort geben; ohne Namensgleichheit ändert sich keine Adresse.

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

Die Abnahme verlangt WCAG AA in beiden Themes, rechnerisch geprüft. An mehreren
Stellen kollidiert das mit der Vorlage. Jedes Mal ist die kleinstmögliche
Änderung gewählt: die Zeichnung bleibt, was sie ankündigt, wird richtig.

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

→ Das „×" der Meldungen oben rechts war die einzige Stelle, an der diese Regel
nicht angewandt war: ohne Polsterung und mit `leading-none` ist das Ziel so
groß wie das Zeichen, rund 8×15px. Es sitzt jetzt in einer 44×44-Fläche, deren
negative Ränder genau den Platz zurückgeben, den sie einnimmt — die Meldung
behält ihre gezeichnete Höhe, das Zeichen steht, wo es stand.

### Ein zweites Rahmentoken für Bedienelemente

`--bd` ist in der Vorlage die Haarlinie zwischen zwei Panelzeilen. Dieselbe
Linie war aber auch die ganze Umrandung eines Eingabefeldes, und dort misst sie
1,34:1 gegen das Panel und 1,20:1 gegen die eigene Füllung. SC 1.4.11 verlangt
3:1 für das, was ein Bedienelement überhaupt als solches erkennbar macht — bei
einem Feld ohne Platzhalter ist das ausschließlich diese Linie.

→ `--bd` bleibt unverändert; Trennlinien sind Dekoration und schulden nichts.
Neu ist `--bd2` allein für die Umrandung von Bedienelementen: `#8a85a8` hell
(3,37:1 gegen `--s1`, 3,03:1 gegen `--s2`) und `#6d6694` dunkel (3,67:1 und
3,44:1). Es trägt `FIELD_CLASS` und damit jedes Textfeld im Backoffice.

→ `scripts/check-contrast.ts` konnte diese Klasse von Fehlern bauartbedingt
nicht sehen: seine Palette kannte `bd` nicht, und es maß ausschließlich Tinte
auf Grund. Es kennt jetzt beide Rahmentoken und hat eine zweite Paarliste mit
der 3:1-Schwelle für Nicht-Text-Kontraste — Feldumrandung und Schalter.

### Fokus auf Bedienelementen, die als `sr-only` unter einer Zeichnung liegen

Die Vorlage zeichnet Segmentschalter, Rollen-Chips, Schalter und Dateifelder
als Flächen. Gebaut sind sie als echte Formularfelder unter dieser Fläche —
`sr-only`, und `sr-only` schneidet mit `clip-path` auch den Fokusring weg, den
`globals.css` zieht. Der Fokus war damit nicht schwach, sondern unsichtbar.

→ Die gezeichnete Fläche bekommt den Ring: `peer-focus-visible:` dort, wo das
Feld ihr Geschwister ist, `has-[:focus-visible]:` dort, wo sie das Label um das
Feld ist. Dieselben 2px Akzentfarbe wie überall, nur eine Ebene höher gezogen.

→ Aus demselben Grund zeichnet der Blockeditor im Artikel jetzt einen Ring: die
editierbare Zeile ist ein `div[contenteditable]`, das die Regel in
`globals.css` nicht erfasste, und ihr `outline-none` hatte in Tailwind v4 auch
den Ring im Fokuszustand mit abgeschaltet. `[contenteditable]` steht jetzt in
derselben Regel wie `a, button, input, textarea, select`.

→ Die beiden `sr-only`-Absendeknöpfe (Archivsuche, Artikelfilter) bekommen
keinen Ring, sondern `tabIndex={-1}`: sie sind da, damit die Eingabetaste im
Feld ohne Skript abschickt, und nicht, um gedrückt zu werden. Ein Tabstopp, der
nirgends auf der Seite etwas anzeigt, ist schlimmer als keiner.

### Was sich beim Tippen ändert, wird auch gesagt

Suchfeld im Archiv und Filter im Backoffice schreiben 180 ms nach dem letzten
Anschlag in die Adresse; die Liste und die Trefferzahl werden neu gerendert,
während der Fokus im Feld sitzt. Ohne Fokuswechsel und ohne Live-Region erfährt
ein Screenreader davon nichts (SC 4.1.3).

→ Eine `role="status"`-Zeile je Formular, `sr-only`, mit einem Satz, der allein
stehend trägt: „3 von 38 Artikeln". Die gezeichnete Zählung im Kasten bleibt,
wo sie ist, wird aber `aria-hidden` — sie stand im `<label>` und gehörte damit
zum Namen des Feldes („Im Archiv suchen 38 von 120").

### Was als Registerkarte gezeichnet ist, ist keine

Die Vorlage zeichnet im Editor drei Reiter (Cover, Details, Veröffentlichen)
und auf der Freigabeseite zwei. Gebaut waren sie mit `role="tab"`, ohne
`tabpanel`, ohne `aria-controls` und ohne Pfeiltastensteuerung — die Rolle
kündigt einem Screenreader also ein Muster an, das es nicht gibt (SC 4.1.2).

→ Die Zeichnung bleibt, die Ankündigung wird ehrlich statt das Muster
nachgerüstet. Im Editor sind es drei Umschaltknöpfe mit `aria-pressed` in einer
benannten `role="group"`. Auf der Freigabeseite sind es Verweise, die die Seite
mit einer anderen Query neu laden — also eine `<nav>` mit `aria-current`.

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
| Dürfen zwei Archivfilter gleichzeitig offen stehen? | Nein, die drei Menüs schließen einander (gemeinsames `name`) | 5a zeichnet nur geschlossene Chips. Unter `md` hängen alle drei Felder am linken Seitenrand der Chipreihe und lägen offen deckungsgleich übereinander |

### Das Zeichen im Reiter, auf dem Home-Bildschirm und in der Adresszeile

Die Vorlage zeichnet kein Symbol. Bisher gab es nur `app/icon.svg` — das
„VA" der Wortmarke auf dem Akzentviolett. Das reicht dem Browserreiter, aber
nicht überall:

- `/favicon.ico` wurde nie ausgeliefert. Wer die Adresse hart abfragt, statt
  den Kopf der Seite zu lesen — ältere Aggregatoren, manche Feed-Reader —,
  bekam die 404-Seite als HTML zurück.
- iOS nimmt für „Zum Home-Bildschirm" kein SVG. Ohne ein eigenes Bild legt es
  einen Bildschirmabzug der Seite auf den Home-Bildschirm.

Beide Dateien sind aus demselben Zeichen abgeleitet, nichts Neues entworfen:
`app/favicon.ico` (16, 32 und 48 Pixel) trägt die abgerundete Ecke wie das
SVG, `app/apple-icon.png` (180 Pixel) nicht — iOS legt seine eigene Maske
darüber, und eine zweite Rundung darunter schnitte die Ecken doppelt ab.

Ein Web-App-Manifest gibt es weiter nicht: die Zeitung soll gelesen, nicht
installiert werden.

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
  zeichnet, nicht als gerahmtes Bild im Text — und als **2:1-Streifen**, der
  zuschneidet. Das hält die Mail kurz: ein Meme ist meist höher als breit, und in
  voller Höhe stünden vor dem ersten Satz 750px Bild. Geschnitten wird mit
  `object-fit`, das jedes heutige Programm versteht; Outlook unter Windows
  ignoriert es und staucht stattdessen. Die Alternative wäre ein Hintergrundbild
  mit VML-Notnagel — viel Markup für eine Benachrichtigung über ein Meme.
- **Eckig waren sie alle.** `table { border-collapse: collapse }` im Reset lässt
  jede Tabelle ihren `border-radius` fallen — Karte und Faktenbox hatten deshalb
  rechte Winkel, während der Knopf rund blieb, weil seine Rundung auf einer Zelle
  sitzt und nicht auf der Tabelle. Jetzt `separate` mit `border-spacing: 0`, das
  die Nahtstellen genauso geschlossen hält.
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

### Node 22 ist die Fassung, gegen die gebaut wird

Nicht aus der Vorlage, sondern aus einem Fehlschlag gelernt. Das Image läuft auf
`node:22-alpine` und die CI auf Node 22; auf dem Entwicklungsrechner lief Node 26.
`node --test tests/` — ein Verzeichnis als Argument — funktioniert auf 26 und
scheitert auf 22, wo Node den Ordner als Datei zu laden versucht: *Cannot find
module …/tests*. Lokal grün, in der CI rot, und die Ursache lag nicht im Test.

→ Die Testskripte benennen ihre Dateien jetzt per Muster statt per Ordner, so wie
es die Integrationszeile ohnehin schon tat. Und `.nvmrc` sowie `engines` im
`package.json` sagen, welche Node-Fassung gilt, damit derselbe Unterschied nicht
noch einmal unbemerkt bleibt.

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

### Auf dem Telefon liegt die Navigation hinter einem Hamburger

**4a** zeigt „Menü" neben einer bereits sichtbaren Navigationsleiste, und so war es
gebaut: ein Wort, das auf eine Leiste darunter sprang, die auf jeder Seite stand
und seitlich scrollte. Auf 390px zeigte sie drei von fünf Einträgen, versteckte
den Rest hinter einer Wischgeste, von der niemand weiß, und kostete eine Zeile
Bildschirm vor der ersten Schlagzeile.

→ Stattdessen ein Hamburger und ein Blatt über den ganzen Schirm. Die drei
Striche werden zum Kreuz, die fünf Ziele kommen gestaffelt herein.

→ **Animiert in CSS, nicht mit GSAP.** Die globale Hausregel nennt GSAP, aber
dieses Projekt animiert durchgehend mit CSS — der Eingang heißt `vaIn` und trägt
die Werte der Vorlage — und GSAP ist keine Abhängigkeit hier. Eine einzuführen
für zwei Eigenschaften, die ohnehin animierbar sind, wäre der größere Eingriff.

→ Das Blatt bleibt eingehängt und wird mit `inert` und `visibility`
abgeschaltet, damit das Schließen ein Übergang ist und kein Verschwinden: ein
Blatt, das auf dem Bild seines Abweisens weg ist, liest sich als Fehler.
Escape schließt, der Fokus geht zurück auf den Knopf, die Seite darunter scrollt
nicht mit, und die Wortmarke kommt mit ins Blatt — sonst wird die obere linke
Ecke für die Dauer der Bewegung leer.

→ Dasselbe im Backoffice, wo die Leiste sechs Einträge hatte und ebenfalls
seitlich scrollte — samt der Review-Warteschlange, dem einzigen Eintrag mit einer
Zahl. Rolle, Name und „Abmelden" ziehen mit ins Blatt, wo Platz dafür ist.

### Das Backoffice nimmt auf dem Telefon den ganzen Schirm

Die Panels waren Karten: Radius, Rahmen ringsum und eine Seitenpolsterung der
Hülle. Auf einem Telefon kostete das elf Pixel je Seite für eine Liste, die die
Breite gebraucht hätte — eine Karte in einem Rand in einem Schirm.

→ Ab `md` unverändert eine Karte, darunter randlos: kein Radius, Rahmen nur oben
und unten, keine Seitenpolsterung. **Der Desktop ist unberührt.**

### Das Cover auf der Startseite bekommt auf dem Telefon Luft

Es saß unmittelbar unter der Kopflinie. 20px darüber, nur auf dem Telefon — auf
dem Desktop füllt das Panel seine eigene Hälfte des Rasters und braucht keinen
Abstand.

### Jeder Link, der die Zeitung verlässt, öffnet ein neues Fenster

Auf Ansage. `lib/outward.ts` entscheidet das an einer Stelle statt an vieren.

→ Der Test ist einfach, weil jede Adresse, die diese Anwendung für sich selbst
schreibt, ein Pfad ist — `articleHref`, `archiveHref`, `imageHref` liefern alle
einen. Eine absolute http-Adresse ist damit per Definition woanders. Nichts zu
konfigurieren, dieselbe Antwort auf dem Server und im Browser.

→ `mailto:` und `tel:` bleiben in Ruhe: sie übergeben an ein anderes Programm,
und ein dafür geöffnetes Tab bleibt leer zurück.

→ `noopener` ist keine Zierde — ohne es kann die geöffnete Seite über
`window.opener` die zurückliegende umleiten. `noreferrer` hält den Weg des Lesers
aus fremden Protokollen.

→ **Interne Verweise bleiben im selben Fenster.** Würden sie es nicht, spränge
bei jedem Klick im Hamburger-Menü ein Tab auf.

### Warum der Quelltext offen ist, steht auf der Startseite

Nicht in der Vorlage. Der Verweis im Fuß sagt, wo der Quelltext liegt, und nichts
darüber, warum — und „Open Source" bei einer Schülerzeitung lädt genau eine
Frage ein: ob damit auch die Artikel Freiwild sind.

→ Ein Abschnitt unten auf der Startseite beantwortet beides: warum offen, und
dass offen der Quelltext ist und nicht die Zeitung. Artikel, Fotos und Memes
gehören denen, die sie gemacht haben.

→ Die Lizenz ist **MIT**, und der Abschnitt nennt sie nicht aus dem Gedächtnis,
sondern verlinkt die Datei `LICENSE` im Repository — die ist die Quelle, und wenn
sie sich ändert, ist der Satz hier nicht plötzlich falsch.

### Die drei Mails, die nur Vorlagen waren, gehen jetzt raus

**8b**, **11b** und **12a** waren gezeichnet, geschrieben, gerendert und geprüft —
und niemand rief sie auf. Die Einladung wurde als Link im Backoffice ausgegeben,
die Freigabe und die Passwortmeldung gar nicht.

→ `lib/editorial/announce.ts` ist die fehlende Verdrahtung. Nichts darin wirft:
eine Einladung, die nicht zugestellt werden konnte, ist immer noch eine
Einladung, und ein freigegebener Artikel bleibt freigegeben, ob die Redaktion
davon erfahren hat oder nicht. Jeder Fehlschlag ist eine Zeile im Protokoll und
ein `false` an den Aufrufer.

→ Die Einladung wird **verschickt und angezeigt**. Der Link steht weiter einmalig
im Formular: die Mail ist der eine Schritt, der das Haus verlässt, und eine
Einladung, die nicht ankam, darf keine sein, die sich nicht weitergeben lässt —
die Person sitzt meist im selben Raum. Die Meldung sagt, was von beidem geschah.

→ Die Freigabemail geht an alle aktiven Admins **und** an die einreichende Person,
entdoppelt, weil das meist dieselben sind. Verschickt wird **nach** der
Entscheidung, nie als Teil davon.

→ Die Passwortmeldung geht nur an andere: das eigene Passwort zu ändern ist
keine Nachricht, die man sich selbst schicken muss.

→ Gebaut und verschickt sind getrennt (`approvedArticleMail` gegen
`announceApprovedArticle`), damit ein Test die fertige Mail ansehen kann, ohne
dass eine rausgeht.

### Jede Aktion im Backoffice meldet sich

Das Profil schrieb stumm: eine Formularaktion ohne Rückgabe, dieselben Felder
danach, kein Hinweis, ob etwas gespeichert wurde. Dasselbe beim Hochladen eines
Memes und beim Setzen eines fremden Passworts — beide sagten es nur in ihrem
eigenen Panel, das wegscrollt.

→ Alle drei melden sich jetzt oben rechts wie alles andere, im Erfolg wie im
Fehlschlag. Geprüft: kein Client-Baustein unter `app/admin/(redaktion)` handelt
mehr ohne Meldung.

→ **Der Speichern-Knopf im Profil ist aus, solange sich nichts geändert hat.** Ein
Speichern, das dieselbe Zeile noch einmal schreibt, ist ein Rundgang zur
Datenbank, eine Neuberechnung dreier öffentlicher Seiten und eine Meldung über
nichts. Nach dem Speichern wandert der Vergleichspunkt mit.

→ Die vier Seiten, die allein stehen — Anmelden, Einladung, Passwort vergessen,
Passwort setzen — bleiben bei ihren Meldungen im Formular. Der Meldungsbereich
hängt in der Admin-Hülle, die es dort nicht gibt, und ein Hinweis neben dem Feld
ist dort ohnehin die richtige Stelle.

### Das Archiv nimmt die ganze Breite, die Karten reagieren auf den Zeiger

Die Archivspalte war auf 860px gedeckelt und ließ auf einem Schirm zwei Drittel
leer. Sie nimmt jetzt die volle Breite wie jede andere Seite; die Schlagzeilen
behalten mit 62 Zeichen ein eigenes Maß, weil eine Zeile quer über 1900px nicht
mehr zu verfolgen ist.

→ Die Karten auf der Startseite heben sich beim Zeigen um vier Pixel und die
Überschrift nimmt den Akzent — beides über `group`, damit Cover und Wort
dieselbe Geste beantworten. **Nur auf Geräten, die wirklich zeigen können:** auf
einem Touchscreen bleibt der Hover-Zustand am zuletzt Berührten hängen, und eine
Karte, die angehoben stehen bleibt, liest sich als ausgewählt. Dafür gibt es die
Variante `can-hover`.

### Wo ein Artikel erscheint, steht im Backoffice

Nicht in der Vorlage. Niemand, der hier schreibt, kann die Abfragen lesen, und
die Antwort ist nicht zu erraten: ein Beitrag kann veröffentlicht, richtig und
trotzdem nirgends zu sehen sein, weil elf neuere davor stehen.

→ Eine ausklappbare Kachel unter der Artikelliste sagt, was wo erscheint und in
welcher Reihenfolge, und was „veröffentlicht" genau heißt — nämlich Status **und**
Zeitpunkt.

→ Die Zahlen darin stehen in `lib/limits.ts`, demselben Modul, aus dem die
Abfragen sie lesen. Ein zweites Mal getippt würden sie auseinanderlaufen, und
eine Erklärung, die auseinanderläuft, ist schlechter als keine: jemand verlässt
sich darauf und liegt falsch.

### Jede öffentliche Seite liest bei jedem Aufruf

Nicht in der Vorlage, sondern aus einem Fehler gelernt. Sechs Seiten trugen
`revalidate = 300` und wurden damit beim Bauen vorgerendert — im Container, der
absichtlich keine Datenbank erreicht. Eingebacken wurde also ihr **Leerzustand**:
die Startseite zeigte „Noch ist nichts veröffentlicht", während das Archiv aus
derselben Datenbank zwölf Artikel auslieferte — weil das Archiv nie vorgerendert
wurde. Nach fünf Minuten zog sich die Startseite selbst nach, aber jeder Deploy
begann mit einer leeren Zeitung.

→ Alle öffentlichen Seiten tragen jetzt `dynamic = "force-dynamic"`. Was vorher
fünf Minuten Zwischenspeicher waren, ist jetzt Streaming: Kopf, Fuß und
Überschriften stehen in der ersten Antwort, die Abfrage folgt in ein Skelett.

→ Die Artikelseite streamt **nicht** als Ganzes, und das ist der eine Fall, wo
es falsch wäre: ein unbekannter Slug antwortet 404, ein alter leitet um, und
beides sind Entscheidungen über die Antwort selbst — nach dem ersten
ausgelieferten Byte nicht mehr zu treffen. Nur „Weiterlesen" darunter kommt
nach, mit einer eigenen Abfrage über ganz andere Artikel.

→ Beim Kontaktformular wartet nur die Chefredaktion in der Seitenspalte. Das
Formular selbst braucht keine Abfrage und steht sofort da.

→ `orNoneAtBuildTime` fängt jetzt **nur während des Baus**. Vorher fing es ohne
zu fragen wann, und jeder Laufzeitfehler sah aus wie eine leere Zeitung: eine
weggebrochene Datenbank wurde dem Leser als „Noch ist nichts veröffentlicht"
gemeldet und sonst niemandem. Jetzt schlägt sie zu `app/error.tsx` durch.

→ Die Skelette (`components/skeleton.tsx`) haben die Maße dessen, was sie
ersetzt, damit beim Eintreffen nichts springt. Ein Schimmer statt eines Pulses,
weil zwanzig pulsende Zeilen wie zwanzig blinkende Dinge lesen und ein Streifen
darüber wie eine ladende Seite. Unter `prefers-reduced-motion` steht die Form
still, aber sie steht.

### Das violette Panel auf den drei Einzelseiten

**7a** zeichnet es nur beim Anmelden. Auf Ansage steht es jetzt auch bei
„Passwort vergessen" und „Neues Passwort setzen" — **nur auf dem Desktop**.

→ Auf dem Telefon bleibt es dem Login vorbehalten. Dort ist die rechte Spalte
der ganze Schirm, und ein Band Violett über einem Formular, das ohnehin der
einzige Inhalt ist, schiebt das erste Feld unter die Kante.

### Die Kontaktmail sieht aus wie die anderen sechs

Sie ging als nackter Text raus, an den gestalteten Vorlagen vorbei, weil sie
älter war als sie und ihren eigenen Versandweg mitbrachte. Der Vermerk im Code,
das zusammenzulegen, stand schon da.

→ Siebte Vorlage, gleicher Rahmen wie die übrigen: Kopfzeile „An …" mit dem
Betreff, Faktenbox mit Name, Klasse, Adresse und Anliegen, darunter der
geschriebene Text Zeile für Zeile, und ein Abschlusssatz.

→ **Kein Knopf.** Jede andere Mail endet in einer Handlung; diese endet in einer
Antwort, und die Antwortadresse steht im Umschlag statt als Verweis im Text.
`sendMail` nimmt dafür jetzt eine eigene Antwortadresse — die der schreibenden
Person, nicht die der Redaktion.

→ Der Text bleibt Text. Er kommt aus dem offenen Netz, und die einzige Stelle,
an der er stehen darf, ist eine mit `white-space: pre-wrap` — nie als Markup.

### Verweis auf den Quelltext im Fuß

Nicht in der Vorlage. Auf Ansage: die Zeitung liegt offen auf GitHub, also sagt
sie auch, wo.

→ Er steht in der unteren Fußzeile, rechtsbündig wie die Rechtsverweise darüber,
und **nicht** in deren Navigation: die Gruppe heißt „Rechtliches" und trägt
Impressum, Datenschutz und den Feed — ein Quelltextverweis ist keines der drei.

### Ein Bild, das aus dem Text fällt, wird auch gelöscht

Auf Ansage: *„wenn es rausgenommen wird wird es gelöscht, auch beim Bearbeiten."*
Bis dahin verlor ein Bild beim Herausnehmen nur seinen Besitzer — Zeile und
Objekt im Speicher blieben für immer liegen.

→ Nicht sofort, und dafür gibt es einen Grund. Der Editor sichert gut eine
Sekunde nach dem letzten Anschlag. Zwischen dem Löschen eines Bildblocks und dem
Rückgängigmachen liegen zwei Sicherungen; würde die erste das Bild wegwerfen,
zeigte das Wiederhergestellte auf nichts mehr. Deshalb zwei Schritte: Speichern
**markiert**, was nicht mehr im Text steht (`images.detached_at`), erneutes
Speichern mit dem Bild darin nimmt die Markierung zurück, und was einen Tag lang
markiert bleibt, wird weggeraumt — Zeile und Objekt.

→ Für den Leser ist es trotzdem sofort weg. `imageAccess` findet zu einem Bild,
auf das kein Artikel zeigt, keinen Artikel mehr; von der ersten Sicherung an wird
es an niemanden mehr ausgeliefert außer an die Person, die es hochgeladen hat.

→ Vor dem Löschen wird noch einmal gefragt. Zwischen Markierung und Kehren liegt
ein Tag, in dem das Bild in einen anderen Artikel kopiert worden sein kann — die
Markierung ist ein Verdacht, die Abfrage ist die Antwort.

→ Memes und Sponsorenlogos können nie mitgerissen werden: markiert wird nur über
den Artikelweg, und kein Artikelkörper nennt sie.

### Jedes Bildformat als Sponsorenlogo, und das Logo wird auch gezeigt

**6b** schreibt „SVG oder PNG mit Transparenz", und gebaut war das als Regel:
alles andere wurde abgewiesen. Auf Ansage — *„bei Sponsoren Logo geht alles, egal
ob transparent oder nicht, aber halt in diesem Rahmen, wo das Logo rein kommt."*

→ Angenommen wird jetzt jedes Bildformat, das ein Browser zeichnet. Transparenz
ist gleichgültig, weil die Kachel ein fester Kasten auf eigenem Grund ist; und
ein JPG abzuweisen hieße nur, dass es vorher jemand schlecht umwandelt. Der Satz
aus 6b steht weiter da, aber als Empfehlung und nicht als Schranke.

→ SVG bleibt der eine Typ, der Vorsicht statt Vertrauen braucht, und das ist
schon geregelt: `imageHeaders` gibt ihn als Download unter einer CSP-Sandbox
heraus, weil ein SVG als eigene Adresse ein Dokument ist, das Skript ausführt.

→ **Das Logo wurde überhaupt nie öffentlich gezeigt.** Die Startseite zeichnete
immer das Kürzel, auch wenn ein Logo hochgeladen war. Es steht jetzt in derselben
Kachel — 34px mobil, 38px auf dem Desktop, `object-contain`, damit eine breite
Wortmarke und ein quadratisches Zeichen beide ganz bleiben. Das Kürzel ist, was
vorher da ist und was bleibt, wenn kein Logo hochgeladen wurde.

### Bilder laufen über die Anwendung, nicht über einen Auslieferungs-Host

Die Aufgabenstellung beschreibt `cdn.levo-studio.com` als Auslieferungsdomain mit
`images.remotePatterns` in `next.config` und der Bild-URL aus `CDN_BASE_URL` plus
Objektschlüssel.

Tatsächlich ist dieser Host die **API des Objektspeichers**, und nichts im Bucket
ist öffentlich.

→ `CDN_BASE_URL` entfällt, es bleibt `S3_ENDPOINT`. `next.config` deklariert keine
`remotePatterns`; der Server liest das Objekt und liefert es aus eigener Herkunft.

→ Damit ist die Route die Zugriffsregel, und nicht der Bucket. `/bild/[id]` —
die Adresse, die jede Seite schreibt — fragt deshalb `lib/editorial/images`,
wem ein Bild gehört und wer es sehen darf, genau wie `/api/bilder/[id]` es für
das Backoffice tut. Ein Jahr Cache bekommt nur, was öffentlich ist; alles andere
geht mit `private, no-store` hinaus, weil ein wieder ausgeblendetes Meme sonst
aus fremden Zwischenspeichern nicht mehr zurückzuholen wäre.

→ **Die Bytes werden durchgereicht, nicht gesammelt.** Beide Bildrouten geben
den Lesestrom des Objektspeichers unmittelbar als Antwortkörper aus. Ein Meme
darf 8 MB groß sein, und eine Galerie fragt Dutzende auf einmal ab — jedes
davon vorher vollständig in den Speicher zu legen, wäre pro Aufruf ein
Vielfaches davon, das der Node-Prozess so lange hält, wie die lesende Leitung
braucht.

→ **Ein SVG-Logo wird als Datei ausgeliefert, nicht als Seite.** Bildschirm 14
lässt SVG als Logoformat zu, und ein SVG ist ein Dokument: ruft jemand die
Bildadresse unmittelbar auf, führt der Browser ein `<script>` darin unter der
Herkunft von Vox Audax und in der Sitzung des Aufrufenden aus. Hochladen darf
ein Logo jeder mit `manageSponsors`, also auch die Redaktion; aufrufen würde die
Adresse am ehesten die Chefredaktion, wenn ein Logo im Backoffice falsch
aussieht. Gezeichnet wird ein Logo überall über `<img>`, und ein `<img>` führt
nie etwas aus — deshalb bleibt das erlaubte Dateiformat, wie die Vorlage es
nennt, und die **Antwort** ändert sich: `content-disposition: attachment` und
`content-security-policy: sandbox`, beides nur für aktive Typen. Sichtbar ist
das allein, wenn man die Bildadresse von Hand öffnet — dann lädt die Datei
herunter, statt sich zu zeigen. Alle anderen Bilder bleiben `inline`.

→ Beide Bildrouten setzen diese Kopfzeilen aus derselben Funktion
(`imageHeaders` in `lib/editorial/images`). Zwei Ausliefernde derselben Bytes
haben schon einmal zwei verschiedene Antworten gegeben; die Regel und die
Kopfzeilen stehen deshalb an einer Stelle, und ein Test in
`test/gate-coverage.test.mts` hält fest, dass niemand im ganzen Routenbaum ein
Objekt liest, ohne vorher `mayReadImage` zu fragen.

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

→ Gefragt wird als Enthaltensein (`@>`) und nicht über die entfalteten Knoten:
dieselbe Frage, aber die einzige Form, die ein Index beantworten kann. Sie
steht auf dem Weg jedes ausgelieferten Bildbytes, und entfaltet hätte sie jedes
Mal jeden Artikelkörper gelesen. `articles_body_idx` (GIN, `jsonb_path_ops`)
bedient sie.

→ Der Alt-Text eines Bildes im Text steht im Dokumentknoten, nicht in der
Spalte `images.alt`. Diese Spalte gehört jetzt allein den Memes und den
Sponsorenlogos.

→ **Ein Bild, auf das noch nichts zeigt, sieht nur, wer es hochgeladen hat.**
Zwischen dem Upload und dem Autosave, der den Bildknoten in den Körper
schreibt, gehört ein Bild zu nichts — und bisher hiess „gehört zu nichts"
angemeldet genügt. Das machte jede fehlschlagende Zuordnung still zu einer
Freigabe: als Editor und Parser sich über die Adressform uneinig waren, stand
kein Bildknoten in irgendeinem Körper, und damit war jedes Bild jedes fremden
Entwurfs für die ganze Redaktion erreichbar. Jetzt entscheidet in diesem Fall
`images.uploaded_by`. Memes und Sponsorenlogos bleiben unverändert: über sie
entscheidet eine Backoffice-Liste, die jedes Mitglied vor sich hat, also bleibt
das Bild für jedes Mitglied erreichbar. 7c — fremder Entwurf „weder sichtbar
noch aufrufbar" — gilt damit auch für die Sekunde vor dem ersten Speichern.

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

### Die Sicherung schreibt nur über den Stand, den sie gelesen hat

Nicht in der Vorlage. Die Sicherung schickt jedes Mal das ganze Dokument, und
denselben Entwurf können zwei Fenster offen haben: derselbe Autor in zwei Tabs,
oder eine Redakteurin, die über `readOthersDrafts` hineinsieht und speichern
darf. Wer zuletzt schrieb, ersetzte Absätze, die er nie gelesen hatte — und es
gibt keine Fassungsgeschichte, aus der sie zurückzuholen wären.

→ Jeder Schreibvorgang nennt den Stand (`updated_at`), auf dem er aufsetzt, und
wird nur ausgeführt, solange die Zeile noch dort steht. Sonst wird nichts
geschrieben, die Meldung oben rechts sagt „Der Entwurf wurde woanders geändert.
Lade die Seite neu — sonst überschreibst du fremde Änderungen.“, und der Editor
schickt nichts mehr. Ein Zusammenführen zweier Fassungen bietet er nicht an:
das ist keine Entscheidung, die eine Sicherung im Hintergrund treffen darf.

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
ruft das auf — auch das eigene Profil, das mit Name und Biografie auf drei
öffentlichen Seiten steht.

→ **Zwei Seiten sind davon ausgenommen, weil sie gar nicht zwischengespeichert
werden.** `/memes` liest seinen Cursor und `/archiv` seine Filter aus der
Abfragezeichenkette; Next rendert beide deshalb pro Aufruf. `/memes` trug
trotzdem ein `revalidate = 300` — eine Frist auf einen Eintrag, den es im
Routen-Zwischenspeicher nie gab. Die Angabe ist entfernt, `/archiv` hatte nie
eine. `refreshPublic.memes()` bleibt stehen: es beschreibt, welche Seite ein
Meme zeigt, und wird richtig, sobald die erste Galerieseite ohne Cursor
auskommt.

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

→ Der Slug-Dialog war dabei ein `div`, das `aria-modal` behauptete, ohne es zu
sein: Tab lief dahinter in den Editor weiter, Escape schloss nur aus dem
Eingabefeld heraus, und beim Schließen fiel der Fokus auf `document.body`. Er
ist jetzt ein natives `<dialog>` mit `showModal()`, wie die beiden anderen
Dialoge im Backoffice — Fokuseinschluss, Escape aus jedem Element und die
Rückgabe an „bearbeiten" kommen damit vom Browser. Die Position oben bleibt
über `margin-block-start` am `<dialog>` erhalten.

→ Beide älteren Dialoge bekommen zusätzlich einen Namen (`aria-labelledby` auf
die Überschrift, `aria-label` dort, wo die Überschrift ein gestaltetes `div`
ist). `showModal()` setzt den Fokus auf den ersten Knopf, und das ist in beiden
Fällen der zerstörende — angekündigt wurde also „Dialog — Endgültig entfernen",
und die Zeile, die die Person nennt, nie.

### Eine frühere eigene Adresse lässt sich zurücknehmen

3b sagt „alte Slugs leiten weiter". Das galt auch gegen den Artikel selbst: wer
„smv-beschluss" zu „smv-entscheidung" gemacht hatte und es sich anders überlegte,
bekam „smv-beschluss-2" — obwohl die Live-Prüfung im Dialog „frei" meldete. Das
Gleiche traf, wer den Dialog öffnete und ohne Änderung bestätigte.

→ Belegt sind Adressen anderer Artikel. Die eigenen — die aktuelle und die
früheren — zählen für diesen Artikel nicht mit, also antworten Prüfung und
Umbenennung wieder dasselbe. Wird eine frühere Adresse zurückgenommen, fällt ihre
Zeile aus der Weiterleitungshistorie: sie führt ja wieder zum Artikel selbst.

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

→ Dieselbe Begründung gilt für das **ersetzte** Logo: wird ein neues
hochgeladen, zeigt auf das alte nichts mehr. Es wird in derselben Transaktion
gelöscht, und sein Objekt fällt nach dem Commit aus dem Bucket — nach drei
Logowechseln lägen dort sonst drei tote Dateien, die niemand mehr zuordnen kann.

### Der Link eines Unterstützers bekommt sein Schema selbst

Die Vorlage zeigt auf 11c „osiander.de“ — ohne `https://`. Ein Browser liest das
als Pfad, der Klick auf der Startseite landete also auf der 404-Seite dieser
Seite statt beim Unterstützer.

→ Das Feld bleibt, wie die Vorlage es zeigt; ergänzt wird serverseitig. Fehlt
das Schema, wird `https://` vorangestellt, und was danach keine Web-Adresse ist,
wird mit „Der Link ist keine Webadresse." abgewiesen statt gespeichert.

### Memes lassen sich ebenfalls löschen

Die Vorlage kennt auf 10a und 11c nur den Schalter, der ein Meme von der Wand
nimmt. Das genügt nicht: ausgeblendet liegt die Bilddatei weiter im
Objektspeicher und wird über `/api/bilder/[id]` weiterhin an jedes angemeldete
Mitglied ausgeliefert. Wer auf einem Meme zu sehen ist und die Löschung
verlangt, wäre damit auf einen Eingriff per SQL und S3-Client angewiesen
gewesen.

→ Neben dem Schalter steht jetzt „Löschen" mit derselben Rückfrage im
Seitendesign wie bei den Unterstützern, für alle, die auch über die Freigabe
entscheiden. Zeile in `memes`, Zeile in `images` und Objekt im Bucket gehen
zusammen; die Reihenfolge ist dieselbe wie beim Logo, weil `memes.image_id` auf
`restrict` steht.

**Artikelbilder haben diesen Weg weiterhin nicht.** Ein Bild, das aus einem
Artikeltext wieder entfernt wird, verliert nur seinen Besitzer im Join von
`lib/editorial/images.ts`; Zeile und Datei bleiben. Bis dafür etwas gebaut ist,
ist der Ersatzweg der Betrieb: Zeile in `images` löschen, Objekt im Bucket
löschen. Das steht unten auch unter „Offen".

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

### Der Build bekommt Platzhalter, keine Geheimnisse

`next build` rendert jede öffentliche Seite vor. Dabei wertet das Root-Layout
`metadataBase` aus, die Seiten fragen die Datenbank, und der Pool entsteht schon
beim Auswerten des Modulgraphen. Ohne `NEXT_PUBLIC_SITE_URL`,
`MAIL_TO_EDITORIAL`, `DATABASE_URL` und `TZ` bricht der Build also ab, bevor
überhaupt ein Image entsteht — und ein echtes Geheimnis darf nicht hinein, weil
es in einer Layer liegen bliebe.

→ Die Build-Stage setzt genau die vier Werte, die keine Geheimnisse sind. Die
ersten beiden stehen mit ihrem echten Wert in `.env.example`; die
Verbindungszeichenfolge zeigt auf `127.0.0.1`, wo im Build-Container nichts
lauscht. Jede Abfrage scheitert dort, und die Seiten fallen auf denselben leeren
Zustand zurück, den sie vor dem ersten Artikel ohnehin zeichnen. Die echten
Werte liefert Dokploy zur Laufzeit, und innerhalb des Revalidate-Fensters von
300 Sekunden ist jede Seite mit ihnen neu gerendert.

Damit Next die Bauzeit-Adresse nicht in den Server-Bundle einbackt, liest
`lib/env.ts` sie aus dem Umgebungsobjekt als Ganzem und nicht als
`process.env.NEXT_PUBLIC_SITE_URL`: einen solchen Einzelzugriff ersetzt Next
beim Bauen durch seinen damaligen Wert.

### Die detaillierte Healthroute prüft vier Abhängigkeiten, nicht zwei

Die Vorlage zeigt keine Healthroute; die Hausregel schreibt sie vor und zeigt in
ihrem Beispielbericht neben der Datenbank auch einen Eintrag `migrations` mit
`pending`. Geprüft wurden aber nur Datenbank und Mail — und beides sah im
Störfall gesund aus, wo es darauf ankam: Ein ausgefallener Objektspeicher ließ
jedes Bild und jeden Upload liegen, während die Route `ok` meldete, und eine
Datenbank, die ein Release überholt hatte, beantwortete `select 1` munter,
während das Backoffice an einer fehlenden Spalte jede Seite mit 500 abwies.

→ Zwei Prüfungen kommen dazu:

- `storage` — ein `HeadBucket` mit eigener Frist von 1,5 s, **nicht** kritisch:
  ein Artikel ohne Bilder ist immer noch ein Artikel, und die Instanz dafür aus
  dem Verkehr zu ziehen kostete die Leser auch den Text.
- `migrations` — die Anzahl geschriebener, aber nicht angewandter Migrationen,
  **kritisch**. Das Journal (`drizzle/meta/_journal.json`) reist im Bundle mit,
  verglichen wird gegen `drizzle.__drizzle_migrations` nach derselben Regel, die
  der Migrator selbst anwendet. Das ändert nichts daran, dass Migrationen von
  Hand aus einem Checkout angewandt werden — es macht nur sichtbar, wenn es
  jemand vergessen hat.

Der Dienstname in beiden Healthrouten heißt dazu passend
`voxaudax-levo-studio` statt `voxaudax`: Die Hausregel benennt Dienste
`<projekt>-levo-studio`, und eine Überwachung, die danach gruppiert, ordnet eine
Antwort ohne dieses Muster keinem Projekt zu.

### Ein Zitat ist im Editor eine Zeile je Absatz

Die Vorlage zeichnet ein Zitat als einen Kasten und sagt nichts darüber, wie es
bearbeitet wird. Der Editor bearbeitet Blöcke, und ein Block ist genau eine
Zeile — bei einem Zitat aus zwei Absätzen hieß das bisher: beide Absätze in eine
Zeile geklebt. Geschrieben werden konnte so ein Zitat nur im Markdown-Feld;
einmal im Rich Text geöffnet, war der Umbruch beim nächsten Autosave weg, ohne
Historie, aus der er zurückzuholen wäre.

→ Ein Zitat wird in eine Zeile je Absatz aufgeteilt, so wie eine Aufzählung in
eine Zeile je Punkt. Aufeinanderfolgende Zitatzeilen wachsen beim Speichern
wieder zu einem Zitat zusammen. Die Folge ist dieselbe wie bei Aufzählungen:
zwei Zitate, die direkt untereinander stehen, sind danach ein Zitat mit zwei
Absätzen.

---

## 8. Offen — braucht eine Entscheidung

- **„Suche" nur auf der Startseite?** Nach Vorlage ja; die Folge ist, dass die
  Suche vom Artikel aus nicht erreichbar ist.
- **`MAIL_FROM`** steht auf einer noreply-Adresse und wird vom Schema abgewiesen.
  Solange sie dort steht, startet die Anwendung nicht.
- **`.design/`** liegt lokal und ist nicht versioniert. Ein Commit wandert
  unumkehrbar in die Historie eines öffentlichen Repositorys.
- **Kein Löschweg für Artikelbilder.** Memes und Sponsorenlogos lassen sich
  vollständig entfernen, ein Bild aus einem Artikeltext nicht: es bleibt in
  `images` und im Objektspeicher stehen, auch wenn es aus dem Text verschwindet.
  Ein Löschersuchen nach Art. 17 DSGVO ist bis dahin nur vom Betrieb aus zu
  erfüllen.
- **Resend** ist ein US-Anbieter. Die globalen Regeln schließen Dienste aus, die
  Daten außerhalb der EU speichern; die Aufgabenstellung schreibt Resend
  ausdrücklich vor. Über das Kontaktformular laufen Namen und Nachrichten von
  Schülerinnen und Schülern.
