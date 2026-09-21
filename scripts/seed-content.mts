import type { Block } from "./seed-prose.mts";

export type SeedMember = {
  readonly email: string;
  readonly name: string;
  readonly initials: string;
  readonly role: "autor" | "redakteur" | "admin";
  readonly form: "weiblich" | "maennlich" | "neutral";
  readonly bio: string;
  readonly ressorts: readonly string[];
};

/** The six of screen 9a, with the roles screen 8a counts: 2 admin, 1 redakteur, 3 autor. */
export const MEMBERS: readonly SeedMember[] = [
  {
    email: "lina.brenner@voxaudax.de",
    name: "Lina Brenner",
    initials: "LB",
    role: "admin",
    form: "weiblich",
    bio: "Schreibt seit der neunten Klasse über Schulpolitik und sitzt in jeder SMV-Sitzung, auch in den langen. Kümmert sich um Themenplanung und Freigaben.",
    ressorts: ["Schulpolitik", "Politik"],
  },
  {
    email: "jonas.weidmann@voxaudax.de",
    name: "Jonas Weidmann",
    initials: "JW",
    role: "admin",
    form: "maennlich",
    bio: "Interessiert sich für alles, was außerhalb der Schule passiert und trotzdem hier ankommt. Verantwortet Recherchen und Faktenchecks.",
    ressorts: ["Politik & Gesellschaft"],
  },
  {
    email: "mira.oezkan@voxaudax.de",
    name: "Mira Özkan",
    initials: "MÖ",
    role: "redakteur",
    form: "weiblich",
    bio: "Berichtet über alles mit Datum: Sommerfest, Schulball, Projekttage. War bei jeder Veranstaltung der letzten zwei Jahre dabei — meist mit Notizblock.",
    ressorts: ["Veranstaltungen"],
  },
  {
    email: "paul.ostermann@voxaudax.de",
    name: "Paul Ostermann",
    initials: "PO",
    role: "autor",
    form: "maennlich",
    bio: "Theater, Konzerte, Bücher. Schreibt Rezensionen, die auch dann fair bleiben, wenn der Abend es nicht war.",
    ressorts: ["Kultur"],
  },
  {
    email: "emil.radtke@voxaudax.de",
    name: "Emil Radtke",
    initials: "ER",
    role: "autor",
    form: "maennlich",
    bio: "Spielt selbst Basketball und schreibt über Schulmannschaften, Turniere und die Frage, warum die Halle immer belegt ist.",
    ressorts: ["Sport"],
  },
  {
    email: "sophie.adler@voxaudax.de",
    name: "Sophie Adler",
    initials: "SA",
    role: "autor",
    form: "weiblich",
    bio: "Zuständig für Recherchen mit Tabellen. Hat die Mensa-Warteschlange gemessen und den Vertretungsplan ausgewertet.",
    ressorts: ["Vermischtes"],
  },
];

export type SeedInvitation = {
  readonly email: string;
  readonly name: string;
  readonly initials: string;
  readonly role: "autor" | "redakteur" | "admin";
  readonly form: "weiblich" | "maennlich" | "neutral";
  readonly invitedAt: string;
  readonly expiresAt: string;
};

/** The two open rows of screen 8a: one link still valid, one already expired. */
export const INVITATIONS: readonly SeedInvitation[] = [
  {
    email: "tom.kessler@voxaudax.de",
    name: "Tom Kessler",
    initials: "TK",
    role: "autor",
    form: "maennlich",
    invitedAt: "2026-09-16T15:20:00+02:00",
    expiresAt: "2026-09-23T15:20:00+02:00",
  },
  {
    email: "nele.hartmann@voxaudax.de",
    name: "Nele Hartmann",
    initials: "NH",
    role: "autor",
    form: "weiblich",
    invitedAt: "2026-08-20T11:05:00+02:00",
    expiresAt: "2026-08-27T11:05:00+02:00",
  },
];

/** The chip row of screen 3a, in the order it reads. */
export const CATEGORIES = [
  { slug: "schulpolitik", name: "Schulpolitik" },
  { slug: "veranstaltungen", name: "Veranstaltungen" },
  { slug: "politik", name: "Politik" },
  { slug: "kultur", name: "Kultur" },
  { slug: "sport", name: "Sport" },
  { slug: "vermischtes", name: "Vermischtes" },
] as const;

export type SeedArticle = {
  readonly slug: string;
  readonly title: string;
  readonly teaser: string;
  readonly category: (typeof CATEGORIES)[number]["slug"];
  readonly author: string;
  readonly publishedAt: string;
  readonly coverWord: string;
  readonly coverLine: string;
  readonly body: readonly Block[];
};

export const ARTICLES: readonly SeedArticle[] = [
  {
    slug: "smv-setzt-handykompromiss-durch",
    title: "SMV setzt Handykompromiss durch",
    teaser:
      "Vier Sitzungen, zwei geplatzte Abstimmungen und ein Antrag, den zuerst niemand lesen wollte. Was die Schülermitverantwortung im Gegenzug aufgegeben hat.",
    category: "schulpolitik",
    author: "lina.brenner@voxaudax.de",
    publishedAt: "2026-09-16T07:00:00+02:00",
    coverWord: "OFFLINE",
    coverLine: "Die Pausen bleiben offline",
    body: [
      {
        p: "Als der Antrag am 3. Juni das vierte Mal auf der Tagesordnung stand, hatte ihn nach eigener Aussage niemand aus dem Gremium vollständig gelesen. Zwölf Zeilen, ein Absatz Begründung — und dahinter die Frage, die seit Februar jede Sitzung überschattet: Bleiben Handys in den Pausen erlaubt?",
      },
      { h2: "Vier Sitzungen bis zur Einigung" },
      {
        p: "Die Schulleitung wollte eine Komplettregelung für alle Jahrgangsstufen, die SMV eine Ausnahme für die Oberstufe. Zwischen diesen beiden Positionen lagen im Februar noch zwei getrennte Anträge, im April ein gemeinsamer Entwurf und im Mai eine Abstimmung, die an drei fehlenden Stimmen scheiterte.",
      },
      {
        p: "Dass es überhaupt weiterging, lag an einem Formfehler: Weil der Mai-Antrag zu spät eingereicht worden war, musste im Juni ohnehin neu verhandelt werden. Diese zweite Chance nutzte die SMV, um den Text zu kürzen — von zwei Seiten auf zwölf Zeilen.",
      },
      {
        quote:
          "Wir haben die Oberstufenregelung aufgegeben, um überhaupt etwas zu bekommen.",
        source: "Tarik Yilmaz, Schülersprecher",
      },
      { h2: "Was ab Oktober gilt" },
      {
        p: "Die neue Fassung steht in vier Sätzen in der Hausordnung. Zusammengefasst:",
      },
      {
        ul: [
          "Handys bleiben in den Pausen in der Tasche, in allen Stufen.",
          "Für Recherche im Unterricht entscheidet die Lehrkraft.",
          "In Freistunden der Oberstufe gilt die Regel nicht.",
          "Verstöße werden nicht mehr mit Einzug geahndet, sondern angesprochen.",
        ],
      },
      { h2: "Wer die Regel durchsetzt" },
      {
        p: "Die Durchsetzung liegt bei den Aufsichten — und damit bei den Lehrkräften, die den Kompromiss mitgetragen haben. Ob das in der Praxis funktioniert, wird sich im November zeigen, wenn die Schulkonferenz ein erstes Mal auswertet. Bis dahin gilt, was im Juni beschlossen wurde: vier Sätze, die niemandem ganz gefallen.",
      },
    ],
  },
  {
    slug: "wahlrechtsreform-erstwaehler",
    title: "Was die Wahlrechtsreform für Erstwähler bedeutet",
    teaser: "Drei Zwölftklässler erklären, woran sie hängen bleiben.",
    category: "politik",
    author: "jonas.weidmann@voxaudax.de",
    publishedAt: "2026-09-14T07:00:00+02:00",
    coverWord: "MAI 2027",
    coverLine: "Die erste Wahl nach der Reform",
    body: [
      {
        p: "Im Mai 2027 wird zum ersten Mal nach der Reform gewählt. An dieser Schule betrifft das 94 Schülerinnen und Schüler, die dann volljährig sind. Drei von ihnen haben wir gebeten, den Stimmzettel zu erklären, den sie bekommen werden.",
      },
      { h2: "Zwei Stimmen, die nicht mehr dasselbe tun" },
      {
        p: "Die Erststimme entscheidet weiterhin, wer den Wahlkreis vertritt — aber nur noch dann, wenn die Partei dieser Person über die Zweitstimmen genug Sitze bekommt. Wer den Wahlkreis gewinnt und trotzdem nicht einzieht, ist ab 2027 kein Sonderfall mehr, sondern eingeplant.",
      },
      {
        quote:
          "Ich verstehe, warum das gemacht wurde. Ich verstehe nicht, wie ich das jemandem in zwei Sätzen erklären soll.",
        source: "Hanna Lechner, Jahrgangsstufe 12",
      },
      { h2: "Woran die drei hängen bleiben" },
      {
        ul: [
          "Dass die Erststimme gewinnen und trotzdem verfallen kann.",
          "Dass der Bundestag kleiner wird, ohne dass ein Wahlkreis wegfällt.",
          "Dass niemand am Wahlabend sagen kann, wer den Wahlkreis vertritt.",
        ],
      },
      {
        p: "Gemeinschaftskunde behandelt die Reform in Jahrgangsstufe 11, also ein Jahr bevor die meisten wählen dürfen. Die Fachschaft prüft nach eigener Auskunft, ob sich das für den Jahrgang 2027 verschieben lässt.",
      },
    ],
  },
  {
    slug: "sommerfest-2026",
    title: "Sommerfest 2026: Ein Abend, der bis 19:40 Uhr funktionierte",
    teaser:
      "Die Nachbetrachtung, inklusive des kollabierten Getränkestands.",
    category: "veranstaltungen",
    author: "mira.oezkan@voxaudax.de",
    publishedAt: "2026-09-12T07:00:00+02:00",
    coverWord: "40° / 800",
    coverLine: "Bis der Getränkestand aufgab",
    body: [
      {
        p: "800 angemeldete Gäste, 40 Grad im Schatten und ein Zeitplan, der bis 19:40 Uhr aufging. Was danach passierte, ist die eigentliche Geschichte dieses Abends.",
      },
      { h2: "Der Plan" },
      {
        p: "Aufbau ab 14 Uhr, Eröffnung um 17, Bühnenprogramm im Halbstundentakt, Abbau ab 22 Uhr. Die Klassenstufe 10 übernahm das Essen, die SMV die Technik, der Förderverein die Getränke. Bis zum letzten Programmpunkt lief das so, wie es aufgeschrieben war.",
      },
      { h2: "Was schiefging" },
      {
        p: "Um 19:40 Uhr war der Getränkestand leer — kalkuliert war mit 400 Litern, ausgegeben wurden sie in zweieinhalb Stunden. Der Nachschub aus dem Getränkemarkt kam um 20:25 Uhr, zu einem Zeitpunkt, an dem ein Teil der Gäste schon gegangen war.",
      },
      {
        quote:
          "Wir haben mit dem Wetter vom letzten Jahr gerechnet. Das war der ganze Fehler.",
        source: "Dilara Kaya, Förderverein",
      },
      {
        p: "Für 2027 liegt bereits ein Vorschlag vor: doppelte Menge, zweiter Ausgabepunkt auf dem Oberstufenhof und ein Kühlanhänger statt der Kühlboxen. Entschieden wird darüber im Februar.",
      },
    ],
  },
  {
    slug: "schultheater-duerrenmatt",
    title: "Das Schultheater wagt sich an Dürrenmatt — und gewinnt",
    teaser:
      "Ein Bühnenbild aus Gerüstteilen, ein Ensemble, das seinen Text kann.",
    category: "kultur",
    author: "paul.ostermann@voxaudax.de",
    publishedAt: "2026-09-11T07:00:00+02:00",
    coverWord: "DÜRREN­MATT",
    coverLine: "Ein Bühnenbild aus Gerüstteilen",
    body: [
      {
        p: "„Der Besuch der alten Dame\" ist ein Stück über Geld, das keine Schülergruppe leichtfertig anfassen sollte. Die Theater-AG hat es trotzdem getan und den Abend gewonnen.",
      },
      { h2: "Die Bühne" },
      {
        p: "Kein gemaltes Güllen, sondern vier Gerüsttürme, die in jeder Szene anders standen. Das Umbauen übernahmen die Spielenden selbst, sichtbar, ohne Vorhang — eine Entscheidung, die dem Stück mehr half als jedes Bühnenbild es gekonnt hätte.",
      },
      { h2: "Das Ensemble" },
      {
        p: "Getragen wurde der Abend von der Titelrolle, die auf jede große Geste verzichtete und gerade dadurch bedrohlich blieb. Der Chor der Güllener wirkte in den ersten zwanzig Minuten unsicher und fand danach einen gemeinsamen Ton, den er bis zum Schluss hielt.",
      },
      {
        p: "Zwei Schwächen bleiben: Das Tempo im zweiten Akt fällt spürbar ab, und die Musik aus der Konserve steht dem Text gelegentlich im Weg. Beides fällt weniger ins Gewicht als die Tatsache, dass hier siebzehn Leute einen Dürrenmatt gespielt haben, ohne ihn zu verkleinern.",
      },
    ],
  },
  {
    slug: "basketball-ag-kreisfinale",
    title:
      "Basketball-AG verliert das Kreisfinale, aber niemand redet über das Ergebnis",
    teaser:
      "54:61 gegen eine Mannschaft, die seit vier Jahren nicht verloren hat — und ein Rückweg, über den mehr gesprochen wurde als über das Spiel.",
    category: "sport",
    author: "emil.radtke@voxaudax.de",
    publishedAt: "2026-09-10T07:00:00+02:00",
    coverWord: "54:61",
    coverLine: "Kreisfinale, und trotzdem ein guter Abend",
    body: [
      {
        p: "54:61 im Kreisfinale gegen das Kepler-Gymnasium, das diesen Titel seit vier Jahren hält. Nach der Schlusssirene ging es in der Kabine um alles außer um das Ergebnis.",
      },
      { h2: "Das Spiel" },
      {
        p: "Nach dem ersten Viertel stand es 9:21. Bis zur Halbzeit war der Rückstand auf sieben Punkte geschmolzen, im dritten Viertel führte die AG zum ersten und einzigen Mal mit zwei Punkten. Die letzten vier Minuten gingen dann 4:13 verloren, weil zwei Stammspieler mit fünf Fouls draußen saßen.",
      },
      { h2: "Warum trotzdem gefeiert wurde" },
      {
        p: "Die AG trainiert seit Oktober zweimal wöchentlich in einer Halle, die sie sich mit drei anderen Gruppen teilt. Aus einer Mannschaft, die im Herbst noch zu neunt antrat, ist eine geworden, die zwölf Spieler einwechseln kann.",
      },
      {
        quote: "Wir haben die Halle nie für uns gehabt. Das Finale schon.",
        source: "Nico Berger, Jahrgangsstufe 11",
      },
    ],
  },
  {
    slug: "mensa-warteschlange-gemessen",
    title: "Wir haben drei Wochen die Mensa-Warteschlange gemessen",
    teaser:
      "15 Schultage, 1.842 gemessene Wartezeiten und ein Muster, das sich jeden Dienstag wiederholt.",
    category: "vermischtes",
    author: "sophie.adler@voxaudax.de",
    publishedAt: "2026-09-07T07:00:00+02:00",
    coverWord: "17 MIN",
    coverLine: "Die längste Wartezeit der Woche",
    body: [
      {
        p: "Vom 17. August bis zum 4. September haben wir an jedem Schultag gestoppt, wie lange es vom Ende der Schlange bis zum Tablett dauert. 1.842 Messungen später lässt sich sagen: Es liegt nicht am Andrang.",
      },
      { h2: "Was gemessen wurde" },
      {
        ul: [
          "Durchschnitt über alle Tage: 8 Minuten 40 Sekunden.",
          "Längste einzelne Wartezeit: 17 Minuten, an einem Dienstag um 12:52 Uhr.",
          "Kürzeste Woche: die mit Vertretungsplan, weil die Mittagspause gestaffelt war.",
        ],
      },
      { h2: "Der Dienstag" },
      {
        p: "An Dienstagen liegt der Schnitt bei 12 Minuten 10 Sekunden, an allen anderen Tagen bei 7 Minuten 30. Der Unterschied ist kein Zufall: Dienstags endet die fünfte Stunde für die Jahrgangsstufen 5 bis 7 gleichzeitig, weil der Förderunterricht anders liegt.",
      },
      {
        p: "Die Mensaleitung kennt die Zahl und verweist auf den Stundenplan. Die Stundenplangruppe verweist auf den Förderunterricht. Wir haben beides nachgerechnet: Eine Verschiebung um zehn Minuten würde den Dienstagsschnitt auf 8 Minuten drücken.",
      },
    ],
  },
  {
    slug: "neue-oberstufenraeume",
    title: "Neue Oberstufenräume: Warum der Umbau ein Jahr länger dauert",
    teaser:
      "Aus Sommer 2027 wird Sommer 2028. Die Begründung steht in einem Brandschutzgutachten, das seit April vorliegt.",
    category: "schulpolitik",
    author: "lina.brenner@voxaudax.de",
    publishedAt: "2026-09-05T07:00:00+02:00",
    coverWord: "+1 JAHR",
    coverLine: "Der Umbau verschiebt sich auf 2028",
    body: [
      {
        p: "Der Umbau des Nordflügels zu Oberstufenräumen sollte im Sommer 2027 fertig sein. Auf der Schulkonferenz im Juli wurde daraus Sommer 2028, ohne dass jemand nachfragte, warum.",
      },
      { h2: "Das Gutachten" },
      {
        p: "Der Grund liegt seit April vor: Ein Brandschutzgutachten verlangt einen zweiten Rettungsweg aus dem zweiten Obergeschoss. Eine Außentreppe ist nicht genehmigungsfähig, weil der Nordflügel unter Denkmalschutz steht, also muss ein innenliegendes Treppenhaus gebaut werden — und das braucht eine eigene Planung.",
      },
      { h2: "Was das kostet" },
      {
        p: "Die Kostenschätzung des Bauamts liegt bei 340.000 Euro zusätzlich. Im Haushalt 2027 ist dieser Betrag nicht eingestellt, also entscheidet der Gemeinderat im Herbst über eine Nachbewilligung. Bis dahin passiert am Nordflügel nichts.",
      },
      {
        p: "Für die jetzige Jahrgangsstufe 11 heißt das: Sie wird das Abitur in den alten Räumen schreiben. Die Oberstufe bleibt bis mindestens Sommer 2028 auf drei Gebäude verteilt.",
      },
    ],
  },
  {
    slug: "buecher-im-deutschunterricht",
    title: "Zehn Bücher, die im Deutschunterricht fehlen",
    teaser:
      "Vorschläge aus vier Jahrgangsstufen — und die Frage, warum die Liste seit 2009 dieselbe ist.",
    category: "kultur",
    author: "sophie.adler@voxaudax.de",
    publishedAt: "2026-09-03T07:00:00+02:00",
    coverWord: "10 TITEL",
    coverLine: "Vorschläge aus vier Jahrgangsstufen",
    body: [
      {
        p: "Wir haben 140 Schülerinnen und Schüler der Jahrgangsstufen 9 bis 12 gefragt, welches Buch sie im Unterricht gelesen hätten. Zehn Titel wurden mehr als fünfmal genannt.",
      },
      { h2: "Die Liste" },
      {
        ul: [
          "Christian Kracht, Faserland",
          "Olga Grjasnowa, Der Russe ist einer, der Birken liebt",
          "Judith Hermann, Sommerhaus, später",
          "Saša Stanišić, Herkunft",
          "Kim de l'Horizon, Blutbuch",
          "Fatma Aydemir, Dschinns",
          "Daniel Kehlmann, Die Vermessung der Welt",
          "Ferdinand von Schirach, Verbrechen",
          "Mariana Leky, Was man von hier aus sehen kann",
          "Clemens Meyer, Als wir träumten",
        ],
      },
      { h2: "Warum keiner davon gelesen wird" },
      {
        p: "Die Lektüreliste der Fachschaft stammt aus dem Jahr 2009 und wurde seither dreimal bestätigt, ohne verändert zu werden. Zwei Titel darauf sind im Buchhandel nicht mehr lieferbar; die Schule besitzt von beiden Klassensätze.",
      },
      {
        p: "Eine Änderung ist möglich: Die Fachschaft kann jederzeit ergänzen, was der Bildungsplan zulässt, und der lässt deutlich mehr zu als die Liste hergibt. Die nächste Fachschaftssitzung ist im November.",
      },
    ],
  },
  {
    slug: "schulball-2026",
    title: "Was auf dem Schulball 2026 anders lief als geplant",
    teaser:
      "Die Musik endete zwei Stunden zu früh, und ausgerechnet das rettete den Abend.",
    category: "veranstaltungen",
    author: "mira.oezkan@voxaudax.de",
    publishedAt: "2026-07-18T07:00:00+02:00",
    coverWord: "22:00",
    coverLine: "Als die Musik zwei Stunden zu früh endete",
    body: [
      {
        p: "Geplant war Musik bis Mitternacht. Um 22:03 Uhr fiel die Anlage aus, und was danach kam, stand in keinem Ablaufplan.",
      },
      { h2: "Der Ausfall" },
      {
        p: "Ein Defekt am Mischpult, kein Ersatzgerät im Haus, die nächste Verleihfirma hat samstags ab 20 Uhr geschlossen. Die Technik-AG brauchte vierzig Minuten, um festzustellen, dass sich nichts machen lässt.",
      },
      { h2: "Was stattdessen passierte" },
      {
        p: "Aus der Aula wurde für zwei Stunden ein Raum, in dem man sich unterhalten konnte. Die Jahrgangsstufe 12 holte eine Bluetooth-Box aus einem Auto, die für fünfzig Leute reichte und für dreihundert nicht — also blieben die meisten sitzen und redeten.",
      },
      {
        quote:
          "Es war der erste Schulball, auf dem ich mit Leuten gesprochen habe, die ich sonst nur vom Sehen kenne.",
        source: "Jarne Roth, Jahrgangsstufe 12",
      },
      {
        p: "Für 2027 steht die Anschaffung eines zweiten Mischpults auf der Wunschliste der Technik-AG. Ob der Abend dadurch besser wird, ist eine andere Frage.",
      },
    ],
  },
  {
    slug: "nachmittag-im-gemeinderat",
    title: "Ein Nachmittag im Gemeinderat, protokolliert von zwei Zehntklässlern",
    teaser:
      "Vier Stunden öffentliche Sitzung, ein Tagesordnungspunkt zur Schule — und 43 Minuten Debatte über einen Fahrradständer.",
    category: "politik",
    author: "jonas.weidmann@voxaudax.de",
    publishedAt: "2026-06-25T07:00:00+02:00",
    coverWord: "TOP 7",
    coverLine: "Vier Stunden für einen Tagesordnungspunkt",
    body: [
      {
        p: "Am 16. Juni saßen zwei Zehntklässler vier Stunden auf der Zuschauerbank des Gemeinderats, um mitzuschreiben, was dort über ihre Schule entschieden wird. Es war ein Tagesordnungspunkt von neun.",
      },
      { h2: "TOP 7" },
      {
        p: "Aufgerufen um 18:42 Uhr, behandelt in elf Minuten: die Nachbewilligung für den Nordflügel wurde vertagt, weil die Kostenschätzung des Bauamts nicht vorlag. Keine Gegenrede, keine Abstimmung, nächster Punkt.",
      },
      { h2: "TOP 8" },
      {
        p: "Danach folgten 43 Minuten über die Überdachung eines Fahrradständers am Sportplatz. Die Debatte drehte sich um die Farbe des Dachs, die Zuständigkeit für die Reinigung und die Frage, ob eine Überdachung Mopeds anzieht.",
      },
      {
        p: "Das ist kein Vorwurf, sondern eine Beobachtung darüber, wie kommunale Tagesordnungen funktionieren: Was Geld kostet und niemand bestreitet, geht schnell. Was wenig kostet und jeder beurteilen kann, dauert.",
      },
    ],
  },
  {
    slug: "zwei-wochen-mensa-essen",
    title: "Zwei Wochen Mensa-Essen, jeden Tag bewertet",
    teaser:
      "Zehn Gerichte, drei Testerinnen, eine Note pro Tag — und ein Ergebnis, das die Mensaleitung nicht überrascht hat.",
    category: "vermischtes",
    author: "sophie.adler@voxaudax.de",
    publishedAt: "2026-05-21T07:00:00+02:00",
    coverWord: "10 TAGE",
    coverLine: "Zehn Gerichte, zehn Noten",
    body: [
      {
        p: "Vom 4. bis zum 15. Mai haben drei Testerinnen jeden Mittag dasselbe Menü gegessen und unabhängig voneinander benotet: Geschmack, Temperatur, Menge. Der Schnitt über zehn Tage liegt bei 3,1.",
      },
      { h2: "Oben und unten" },
      {
        ul: [
          "Beste Note: Linsen mit Spätzle, 1,7 — an einem Donnerstag.",
          "Schlechteste Note: Nudelauflauf, 4,7 — vor allem wegen der Temperatur.",
          "Größte Abweichung zwischen den Testerinnen: Gemüsecurry, zwischen 2,0 und 4,3.",
        ],
      },
      { h2: "Die Temperatur" },
      {
        p: "An sieben von zehn Tagen war das Hauptgericht bei der dritten Testerin kälter als bei der ersten, die zwanzig Minuten früher in der Schlange stand. Das ist keine Frage des Kochens, sondern der Warmhaltezeit — und die hängt daran, wie lange die Schlange ist.",
      },
      {
        p: "Die Mensaleitung sagt, das sei bekannt, und verweist auf eine zweite Ausgabetheke, die seit 2024 beantragt ist.",
      },
    ],
  },
  {
    slug: "dritte-pause-zehn-minuten",
    title: "Warum die dritte Pause zehn Minuten länger werden sollte",
    teaser:
      "Fünf Minuten reichen nicht, um vom Nordflügel in den Naturwissenschaftstrakt zu kommen. Wir haben es gestoppt.",
    category: "schulpolitik",
    author: "lina.brenner@voxaudax.de",
    publishedAt: "2025-11-12T07:00:00+01:00",
    coverWord: "3. PAUSE",
    coverLine: "Zehn Minuten, die fehlen",
    body: [
      {
        p: "Die dritte Pause dauert fünf Minuten. Der Weg vom Musiksaal im Nordflügel in den Chemiesaal dauert, gemessen an zwölf Tagen und mit normalem Schritttempo, zwischen sechs und acht.",
      },
      { h2: "Die Messung" },
      {
        p: "Wir sind den Weg zwanzigmal gegangen, in beide Richtungen, jeweils direkt nach dem Klingeln. Schnellster Durchgang: 5 Minuten 50 Sekunden, ohne Gegenverkehr im Treppenhaus. Langsamster: 8 Minuten 20, mit.",
      },
      { h2: "Was das im Unterricht bedeutet" },
      {
        p: "Zwei bis drei Minuten pro Stunde, in denen die Klasse unvollständig ist. Hochgerechnet auf ein Schuljahr sind das für die betroffenen Kurse rund neun Zeitstunden Unterricht, die mit Ankommen vergehen.",
      },
      {
        p: "Die SMV hat im Oktober beantragt, die dritte Pause auf fünfzehn Minuten zu verlängern und dafür die Mittagspause zu kürzen. Der Antrag liegt seitdem bei der Schulkonferenz.",
      },
    ],
  },
];

export type SeedSponsor = {
  readonly name: string;
  readonly initials: string;
  readonly url: string | null;
  readonly kind: "druckkosten" | "material" | "technik" | "foerderverein";
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status: "review" | "published";
  readonly createdBy: string | null;
};

/** Screen 6a gives the four kinds and the three runtimes; 11a gives the one name it names. */
export const SPONSORS: readonly SeedSponsor[] = [
  {
    name: "Förderverein des Uhland-Gymnasiums",
    initials: "FU",
    url: "https://foerderverein-uhland-gymnasium.de",
    kind: "foerderverein",
    startsAt: "2026-09-01T00:00:00+02:00",
    endsAt: "2027-09-01T00:00:00+02:00",
    status: "published",
    createdBy: "lina.brenner@voxaudax.de",
  },
  {
    name: "Druckhaus Neckartal",
    initials: "DN",
    url: "https://druckhaus-neckartal.de",
    kind: "druckkosten",
    startsAt: "2026-09-01T00:00:00+02:00",
    endsAt: "2027-03-01T00:00:00+01:00",
    status: "published",
    createdBy: "lina.brenner@voxaudax.de",
  },
  {
    name: "Computerhaus Tübingen",
    initials: "CT",
    url: "https://computerhaus-tuebingen.de",
    kind: "technik",
    startsAt: "2026-09-01T00:00:00+02:00",
    endsAt: "2026-12-01T00:00:00+01:00",
    status: "published",
    createdBy: "jonas.weidmann@voxaudax.de",
  },
  {
    name: "Sportgeschäft Renz",
    initials: "SP",
    url: "https://sportgeschaeft-renz.de",
    kind: "material",
    startsAt: "2026-09-01T00:00:00+02:00",
    endsAt: "2027-03-01T00:00:00+01:00",
    status: "review",
    createdBy: "emil.radtke@voxaudax.de",
  },
];

export const PAGES: readonly {
  readonly slug: string;
  readonly title: string;
  readonly body: readonly Block[];
}[] = [
  {
    slug: "impressum",
    title: "Impressum",
    body: [
      { h2: "Herausgeber" },
      {
        p: "Schülerzeitung Vox Audax, Uhland-Gymnasium, Uhlandstraße 12, 72072 Tübingen",
      },
      { h2: "Verantwortlich für den Inhalt" },
      {
        p: "Lina Brenner (Chefredakteurin) und Jonas Weidmann (Chefredakteur). Betreuende Lehrkraft: Dr. Annika Halm. redaktion@voxaudax.de",
      },
      { h2: "Haftung für Inhalte" },
      {
        p: "Alle Beiträge werden von Schülerinnen und Schülern erstellt und spiegeln nicht notwendigerweise die Position der Schule wider. Für externe Links ist jeweils der Anbieter der verlinkten Seite verantwortlich.",
      },
      { h2: "Bildrechte" },
      {
        p: "Titelbilder werden, wenn kein Foto vorliegt, typografisch aus Titel und Kategorie erzeugt. Fotos stammen von der Redaktion, sofern nicht am Bild anders angegeben.",
      },
      { h2: "Technik und Umsetzung" },
      {
        p: "Diese Website wurde gebaut von Levo Studio — Konzept, Design, Frontend und Redaktionssystem. Danke an Julius für Aufbau und Betrieb. Selbst gehostet, keine externen Laufzeit-Requests, kein Tracking.",
      },
    ],
  },
  {
    slug: "redaktion",
    title: "Die Redaktion",
    body: [
      {
        p: "Sechs Schülerinnen und Schüler aus den Klassen 9 bis 12. Wir treffen uns mittwochs in der siebten Stunde in Raum 214 und entscheiden dort, worüber geschrieben wird — redaktionell unabhängig von Schulleitung und Förderverein.",
      },
      { h2: "Mitmachen" },
      {
        p: "Wer schreiben, fotografieren, recherchieren oder layouten will, kommt einfach mittwochs dazu. Vorkenntnisse braucht niemand, ein Thema reicht. redaktion@voxaudax.de",
      },
      {
        p: "Betreuende Lehrkraft: Dr. Annika Halm. Sie liest keine Texte vor der Veröffentlichung gegen — die Verantwortung für die Inhalte liegt bei der Redaktion.",
      },
    ],
  },
];
