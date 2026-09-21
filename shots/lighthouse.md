# Lighthouse

Gemessen am **Produktionsbuild**, ausgeliefert als Standalone-Server
(`pnpm build`, dann `node .next/standalone/server.js` mit `.next/static` und
`public` daneben kopiert) — nicht mit `next start`, weil der Container es so
nicht startet.

Lighthouse 12.8.2, Google Chrome headless, drei Seiten, alle vier Kategorien.
Die Zahlen sind ein lokaler Lauf gegen `http://localhost:7897`: keine
Netzlatenz zum Server, dafür Lighthouses eigene simulierte Drosselung.

Wiederholen:

```
pnpm build
cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public
(cd .next/standalone && PORT=7897 node --env-file=../../.env server.js)

npx lighthouse@12 http://localhost:7897/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new"
```

---

## Mobil (Lighthouse-Standard: 412×823, Slow 4G, CPU ×4)

| Seite | Performance | Barrierefreiheit | Best Practices | SEO |
|---|---|---|---|---|
| `/` | **94** | **93** | **96** | 100 |
| `/artikel/smv-setzt-handykompromiss-durch` | **94** | **96** | **96** | 100 |
| `/archiv` | **92** | 100 | **96** | 100 |

Messwerte dazu:

| Seite | FCP | LCP | TBT | CLS | Speed Index | Übertragen |
|---|---|---|---|---|---|---|
| `/` | 0,8 s | 3,2 s | 0 ms | 0 | 0,9 s | 389 KiB |
| `/artikel/…` | 0,8 s | 3,2 s | 0 ms | 0 | 0,8 s | — |
| `/archiv` | 0,9 s | 3,3 s | 0 ms | 0 | 0,9 s | — |

## Desktop (Preset `--preset=desktop`: 1350×940, kabelgebunden, CPU ×1)

| Seite | Performance | Barrierefreiheit | Best Practices | SEO |
|---|---|---|---|---|
| `/` | 100 | **93** | **96** | 100 |
| `/artikel/smv-setzt-handykompromiss-durch` | 100 | **96** | **96** | 100 |
| `/archiv` | 100 | 100 | **96** | 100 |

FCP 0,2 s, LCP 0,6–0,7 s, TBT 0 ms, CLS 0 auf allen drei Seiten.

---

## Was unter 95 liegt, Audit für Audit

Fett markiert ist oben jede Zahl unter 95. Vier Audits sind dafür
verantwortlich. Keines davon ist geschönt: unten steht der gemessene Wert und
warum er so ist.

### 1. `largest-contentful-paint` — 3,2 s mobil (Gewicht 25)

Betrifft alle drei Seiten, mobil. Auf dem Desktop misst dasselbe Audit 0,6 s.

Die Aufschlüsselung, die Lighthouse für `/` liefert:

| Phase | Anteil | Zeit |
|---|---|---|
| TTFB | 14 % | 452 ms |
| Load Delay | 0 % | 0 ms |
| Load Time | 0 % | 0 ms |
| **Render Delay** | **86 %** | **2702 ms** |

Das LCP-Element ist der Teaser-Absatz unter der Titelzeile — Text, kein Bild.
FCP liegt bei 0,8 s, TBT bei 0 ms, CLS bei 0: gerendert ist die Seite früh und
ruhig. Die 2,7 s Render Delay sind die beiden vorgeladenen Schriften:

| Datei | Größe |
|---|---|
| Bricolage Grotesque (variabel, 200–800) | 150 572 B |
| Inter Tight (variabel, 100–900) | 112 892 B |

`font-display: swap` steht bereits, der erste Anstrich kommt also mit der
Systemschrift. Der endgültige Anstrich des LCP-Elements — und damit der Wert,
den das Audit misst — fällt trotzdem erst, wenn die Schrift getauscht ist, und
263 KiB brauchen bei Lighthouses simulierten 1,6 Mbit/s genau diese
Größenordnung.

Was es kleiner machen würde, kostet jeweils etwas an der Gestaltung und ist
deshalb hier nicht entschieden, sondern benannt:

- den Gewichtsbereich der variablen Schriften einengen (3a nutzt 200 bis 800 —
  der volle Bereich ist der teuerste Teil der Datei),
- die Anzeigeschrift nur für die Überschriften laden und die Fließtexte auf
  Inter Tight setzen,
- `size-adjust`-Metriken für die Ersatzschrift hinterlegen, damit der erste
  Anstrich bereits die endgültige Zeilenbreite hat.

### 2. `link-in-text-block` — Score 0 (Gewicht 7)

Ein Verweis mitten im Fließtext muss sich ohne Farbe erkennen lassen, oder
seine Farbe muss mindestens 3:1 gegen den umgebenden Text messen.

| Seite | Element |
|---|---|
| `/` | `<a href="/archiv?autor=lina-brenner" class="py-[15px] text-tx">Lina Brenner</a>` — steht in `text-tx`, also **exakt der Farbe des Fließtextes**, ohne Unterstreichung |
| `/artikel/…` | `<a href="/archiv?kategorie=schulpolitik" class="py-[15px] text-ac">Schulpolitik</a>` in der Meta-Zeile über der Überschrift |

Der Entwurf zeichnet beide ohne Unterstreichung. Das ist der Konflikt, den 4.
von `EXTRAPOLATION.md` für zwei andere Stellen schon aufgemacht hat, und er
gehört entschieden, nicht nebenbei geändert.

### 3. `heading-order` — Score 0 (Gewicht 3), nur `/`

Die erste Artikelkarte der Kartenreihe ist ein `<h3>`, und davor steht die
`<h1>` des Titelthemas — die `<h2>`-Ebene fehlt zwischen beiden. Die
`<h2>`-Elemente der Startseite („Außerdem", „Unterstützt durch", „Die
Redaktion") kommen erst danach.

```
div.md:bg-s1 > article.grid > div > h3.mt-1.5
„Was die Wahlrechtsreform für Erstwähler bedeutet"
```

Der Entwurf gibt der Kartenreihe keine sichtbare Überschrift. Eine für
Screenreader ergänzte `<h2>` oder das Herabstufen der Karten auf `<h2>` löst es
— beides ist eine Entscheidung über die Dokumentstruktur und steht deshalb hier
statt im Code.

### 4. `errors-in-console` — Score 0 (Gewicht 1), alle drei Seiten

```
Failed to load resource: the server responded with a status of 404 (Not Found)
http://localhost:7897/favicon.ico
```

Es gibt kein Favicon. `public/` enthält nur `.gitkeep`, und `app/` hat weder
`icon.*` noch `favicon.ico`. Jeder Browser fragt die Adresse trotzdem an und
bekommt die 404-Seite — 24 745 Byte HTML pro Aufruf. Ein `app/icon.svg` würde
es beheben; welches Zeichen darin steht, entwirft die Vorlage nicht.

---

## Was nicht zählt, aber auffiel

- `render-blocking-resources` meldet das Stylesheet mit 152 ms geschätzter
  Einsparung und einem Score von 0,5. Es fließt mit Gewicht 0 in die Note ein
  und bleibt hier nur als Notiz stehen.
- `server-response-time`: 2,1 ms für das Dokument. Die Seiten sind
  vorgerendert, die Datenbank steht beim Ausliefern nicht im Weg.
