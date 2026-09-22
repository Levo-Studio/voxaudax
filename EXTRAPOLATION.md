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

- Die Zeile „An alle Admins und …" samt fettem Betreff sitzt im **Mock-Kopf des
  Mailprogramms**, und „Die Mail, die ankommt" ist eine Beschriftung des
  Entwurfsdokuments. Beides wird nicht in die Mail gerendert: die Empfängerliste
  ist der Umschlag, die fette Zeile der Betreff.
- **Kopf und Fußzeile** sind ergänzt, weil eine eigenständige Mail einen
  erkennbaren Absender braucht. Wortmarke wie in 8b und 12b, Fußzeile im
  Wortlaut des Entwurfs.
- **Vorschautexte** zeichnet der Entwurf nicht. Sie ergänzen, was der Betreff
  weglässt, statt ihn zu wiederholen.
- **Das Meme hat keinen Titel**, also nutzt seine Freigabemail den ausgeschriebenen
  Betreff aus 11b statt eines Titelmusters.
- „Du bekommst es persönlich von **ihr**." (12a) ist gegendert und aus einem Namen
  nicht ableitbar, also trägt der Prüfer sein Pronomen mit.

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

### Kategorieleiste zeigt nur Kategorien mit Artikeln

Die Vorlage zeichnet sechs feste Pillen. Die Kategorien stehen aber in einer
Tabelle, die die Redaktion erweitern kann — und eine Pille für eine Kategorie
ohne veröffentlichten Artikel führt in ein leeres Archiv.

→ Leiste und Archivfilter lesen die Kategorien, in denen tatsächlich etwas
veröffentlicht ist. Dieselbe Regel gilt im Entwurf bereits für den Autorfilter.
Die Auswahl im Editor bleibt vollständig: dort muss jede Kategorie wählbar sein,
sonst könnte die erste nie vergeben werden.

### „Mitschreiben" auf der Startseite kommt aus der Redaktionsseite

Die Vorlage zeichnet den Kasten auf 3a mit eigenem Text und den auf 9a mit
seinem — zweimal dieselbe Einladung, zweimal eigenständig gesetzt.

→ Beide lesen jetzt denselben Absatz aus der Zeile `pages.redaktion`. Vorher
stand der Text der Startseite im Code: eine geänderte Uhrzeit hätte an zwei
Stellen gepflegt werden müssen und wäre an einer stehen geblieben.

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
