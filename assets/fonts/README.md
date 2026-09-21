# Fonts

Three families, each a variable font subset to `latin` and `latin-ext` so that
German, Turkish and Polish names render in one face rather than falling back
part-way through a word.

| File | Family | Axes | Used for |
|---|---|---|---|
| `bricolage-grotesque.woff2` | Bricolage Grotesque | `opsz` 12–96, `wght` 200–800, `wdth` 75–100 | Headlines and body — the page's default stack |
| `inter-tight.woff2` | Inter Tight | `wght` 100–900 | Buttons, form controls and other interface text |
| `jetbrains-mono.woff2` | JetBrains Mono | `wght` 100–800 | Slugs, code and Markdown source |

All three are licensed under the SIL Open Font License 1.1, reproduced in
`OFL.txt`. Sources: [Bricolage Grotesque](https://github.com/ateliertriay/bricolage)
by Atelier Triay, [Inter Tight](https://github.com/rsms/inter) by Rasmus
Andersson, [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) by
JetBrains.

They are served by `next/font/local` from outside `public/`, so each arrives
under a hashed, immutable URL and nothing is requested from Google at run time.
