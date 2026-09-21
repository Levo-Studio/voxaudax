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

### `Reply-To` auf den Systemmails

Die Aufgabenstellung verbietet „noreply" als Absendernamen. Resend verlangt eine
verifizierte Absenderdomain, die üblicherweise eine eigene Subdomain ist und kein
Postfach hat.

→ Absender auf der Versand-Subdomain, `Reply-To` auf `redaktion@voxaudax.de` —
die Adresse, die die Vorlage auf sechs Screens nennt. Damit erreicht eine Antwort
einen Menschen, ohne dass für die Versand-Subdomain ein Postfach nötig wird.

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
