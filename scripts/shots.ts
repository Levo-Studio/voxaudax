import { createHash, randomBytes } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { Pool } from "pg";
import { chromium, type BrowserContext, type Page } from "playwright";

import { SIGN_IN_ERROR } from "../app/admin/sign-in-state.ts";
import type { TipTapDocument } from "../lib/content.ts";
import { suggestCoverColorId } from "../lib/cover.ts";
import { environmentSchema } from "../lib/env-schema.ts";
import { THEME_STORAGE_KEY } from "../lib/theme.ts";
import { countWords } from "../lib/word-count.ts";

/**
 * One screenshot per designed screen, in both themes and at both widths, so
 * that what the design document draws and what the application renders can be
 * laid side by side.
 *
 * Run it against a running server, standalone or dev:
 *
 *   pnpm build && (cd .next/standalone && node server.js)
 *   pnpm shots
 *
 * Nine of the screens are behind the login, and there is no account to borrow:
 * the seed leaves `velve.user` empty on purpose. So the run mints its own
 * invitations, redeems them through the form the way a person would,
 * photographs the back office, and then takes the accounts apart again — the
 * editorial row first, because `users.velve_user_id` references
 * `velve.user(id)` and deleting an account before the reference is cleared
 * would cascade into the editorial table.
 *
 * Nothing seeded is written to. What the run adds it also removes, and the
 * removal is confined to addresses carrying the mark below.
 */

const BASE_URL = process.env.SHOTS_BASE_URL ?? "http://localhost:7897";
const OUTPUT = fileURLToPath(new URL("../shots/", import.meta.url));

/**
 * Everything this run writes into the database carries this, so that a row left
 * behind by an interrupted run is recognisable as this script's and not as
 * seeded content.
 */
const MARK = "zz-shot-";

/**
 * Two accounts, because screen 12a is an admin setting somebody else's
 * password and the page refuses a member who has never set one — which every
 * seeded member is, since the seed deliberately leaves `velve.user` empty. So
 * one account takes the photographs and a second one exists to be the subject
 * of that screen. Both are taken apart again at the end.
 */
const SHOT_ACCOUNTS = {
  photographer: {
    email: `${MARK}fotograf@voxaudax.de`,
    name: "zz-shot Fotograf",
    initials: "ZS",
    role: "admin",
  },
  subject: {
    email: `${MARK}kollegin@voxaudax.de`,
    name: "zz-shot Kollegin",
    initials: "ZK",
    role: "redakteur",
  },
} as const;

type ShotAccount = (typeof SHOT_ACCOUNTS)[keyof typeof SHOT_ACCOUNTS];

/** Never printed and never stored: it dies with the account at the end. */
const shotPassword = () => randomBytes(24).toString("base64url");

const THEMES = { hell: "light", dunkel: "dark" } as const;
type ThemeName = keyof typeof THEMES;

const WIDTHS = [375, 1280] as const;
type Width = (typeof WIDTHS)[number];

/**
 * A phone reports two device pixels per CSS pixel and a laptop one, and the
 * point of these files is to read the type, so each width is photographed at
 * the density it is actually seen at.
 */
const density: Record<Width, number> = { 375: 2, 1280: 1 };

type Screen = {
  /** The design document's id, which is also the file stem. */
  readonly id: string;
  readonly path: string;
  /** What the design calls it, kept beside the route it was mapped to. */
  readonly drawnAs: string;
  readonly session: boolean;
  /** Screens that are a state rather than an address reach it from here. */
  readonly reach?: (page: Page) => Promise<void>;
};

type Fixtures = {
  readonly articleId: string;
  readonly articleSlug: string;
  /** The second shot account, whose password screen 12a has an admin reset. */
  readonly subjectId: string;
  readonly invitationToken: string;
};

/**
 * Screens the design draws at one width only are still photographed at both:
 * 4a is 3a on a phone, 5d is 5a and 5b on a phone, 9b is 9a, 10c is 10a, 13b is
 * 13a, 4b is 3b and 7b is 7a after a refused sign-in. They are listed here
 * under their own ids because that is how the design refers to them, and a file
 * named 4a is the one somebody comparing against 4a will look for.
 */
const screensOf = (fixtures: Fixtures): readonly Screen[] => [
  { id: "3a", path: "/", drawnAs: "Startseite komplett", session: false },
  { id: "4a", path: "/", drawnAs: "Startseite mobil", session: false },
  { id: "5a", path: "/archiv", drawnAs: "Archiv", session: false },
  { id: "5b", path: "/kontakt", drawnAs: "Kontakt", session: false },
  { id: "5c", path: "/impressum", drawnAs: "Impressum", session: false },
  { id: "5d-archiv", path: "/archiv", drawnAs: "Archiv mobil", session: false },
  { id: "5d-kontakt", path: "/kontakt", drawnAs: "Kontakt mobil", session: false },
  { id: "9a", path: "/redaktion", drawnAs: "Redaktion", session: false },
  { id: "9b", path: "/redaktion", drawnAs: "Redaktion mobil", session: false },
  { id: "10a", path: "/memes", drawnAs: "Memes öffentlich", session: false },
  { id: "10c", path: "/memes", drawnAs: "Memes mobil", session: false },
  {
    id: "13a",
    path: `/artikel/${fixtures.articleSlug}`,
    drawnAs: "Artikel",
    session: false,
  },
  {
    id: "13b",
    path: `/artikel/${fixtures.articleSlug}`,
    drawnAs: "Artikel mobil",
    session: false,
  },
  { id: "7a", path: "/admin", drawnAs: "Login unter /admin", session: false },
  {
    id: "12b",
    path: "/admin/passwort-vergessen",
    drawnAs: "Passwort vergessen",
    session: false,
  },
  {
    id: "8b",
    path: `/admin/einladung/${fixtures.invitationToken}`,
    drawnAs: "Einladung öffnen",
    session: false,
  },

  {
    id: "7c",
    path: "/admin/artikel",
    drawnAs: "Nach dem Login · Artikelübersicht",
    session: true,
  },
  {
    id: "3b",
    path: `/admin/artikel/${fixtures.articleId}`,
    drawnAs: "Editor",
    session: true,
  },
  {
    id: "4b",
    path: `/admin/artikel/${fixtures.articleId}`,
    drawnAs: "Editor mobil",
    session: true,
  },
  { id: "11a", path: "/admin/review", drawnAs: "Review", session: true },
  {
    id: "6a",
    path: "/admin/unterstuetzer",
    drawnAs: "Unterstützer verwalten",
    session: true,
  },
  { id: "8a", path: "/admin/nutzer", drawnAs: "Nutzer", session: true },
  { id: "8c", path: "/admin/konto", drawnAs: "Konto", session: true },
  { id: "10b", path: "/admin/memes", drawnAs: "Memes im Admin", session: true },
  {
    id: "12a",
    path: `/admin/nutzer/${fixtures.subjectId}/passwort`,
    drawnAs: "Admin setzt ein neues Passwort",
    session: true,
  },

  /**
   * Last on purpose. Every visit here spends one of the three sign-in attempts
   * the address is allowed, and a locked address would take the back office
   * down with it if anything above still needed to sign in.
   */
  {
    id: "7b",
    path: "/admin",
    drawnAs: "Login · Fehlerfall",
    session: false,
    reach: async (page) => {
      await page.fill('input[name="email"]', `${MARK}unbekannt@voxaudax.de`);
      await page.fill('input[name="password"]', shotPassword());
      await page.click('button[type="submit"]');

      // The refusal itself, not any live region: a server action makes the
      // framework mount its own empty `role="alert"` announcer, which is there
      // milliseconds after the click and would be photographed instead of the
      // message — the form still mid-submit and the screen not yet 7b.
      await page.getByText(SIGN_IN_ERROR).waitFor();
    },
  },
];

const connection = environmentSchema
  .pick({ DATABASE_URL: true })
  .safeParse(process.env);

if (!connection.success) {
  console.error("DATABASE_URL is missing or is not a URL.");
  process.exit(1);
}

const pool = new Pool({ connectionString: connection.data.DATABASE_URL, max: 2 });
pool.on("error", () => undefined);

const digest = (token: string) =>
  createHash("sha256").update(token, "utf8").digest();

/**
 * The same two rows `issueInvitation` writes, written here because issuing one
 * through the back office needs a session and a session is what this is for.
 */
const mintInvitation = async (account: ShotAccount) => {
  const token = randomBytes(32).toString("base64url");

  const { rows: admins } = await pool.query<{ id: string }>(
    `select id from public.users where role = 'admin' and status = 'aktiv'
     and email not like $1 order by created_at limit 1`,
    [`${MARK}%`],
  );
  const invitedBy = admins[0]?.id;
  if (invitedBy === undefined) {
    throw new Error("No active admin to issue the invitation from.");
  }

  await pool.query(
    `insert into public.users (email, name, initials, role, form, status, invited_at)
     values ($1, $2, $3, $4, 'neutral', 'eingeladen', now())`,
    [account.email, account.name, account.initials, account.role],
  );

  await pool.query(
    `insert into public.invitations (email, name, role, form, token_sha256, expires_at, invited_by)
     values ($1, $2, $3, 'neutral', $4, now() + interval '2 hours', $5)`,
    [account.email, account.name, account.role, digest(token), invitedBy],
  );

  return token;
};

/**
 * Screen 11a is a queue, and the seed leaves it empty: nothing is submitted and
 * every article is already published, so the screen would be photographed
 * showing the sentence it prints when there is nothing to decide. One
 * submission is written for it, authored by the subject account rather than by
 * the photographer — the last row of the role table says nobody releases their
 * own submission, and a row the photographer cannot act on is the wrong half of
 * the screen to show.
 */
const SUBMISSION = {
  slug: `${MARK}eingereichter-artikel`,
  title: "zz-shot: Was der Aufnahmeraum kostet",
  teaser:
    "Ein Probelauf für die Freigabe: eingereicht, wartet auf eine Entscheidung, gehört keiner Ausgabe an.",
} as const;

const writeSubmission = async () => {
  const body: TipTapDocument = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Dieser Text steht nur in der Freigabe-Warteschlange und wird nach der Aufnahme wieder entfernt.",
          },
        ],
      },
    ],
  };

  const cover = {
    word: "FREIGABE",
    line: "Wartet auf eine Entscheidung",
    colorId: suggestCoverColorId(SUBMISSION.title),
  };

  await pool.query(
    `insert into public.articles
       (slug, title, teaser, body, cover, category_id, author_id, status, submitted_at, word_count)
     select $1, $2, $3, $4::jsonb, $5::jsonb, c.id, u.id, 'review', now() - interval '2 days', $7
     from public.categories c, public.users u
     where c.position = (select min(position) from public.categories) and u.email = $6`,
    [
      SUBMISSION.slug,
      SUBMISSION.title,
      SUBMISSION.teaser,
      JSON.stringify(body),
      JSON.stringify(cover),
      SHOT_ACCOUNTS.subject.email,
      countWords(body),
    ],
  );
};

/**
 * The editorial rows lose their reference first. `users.velve_user_id` is a
 * foreign key onto `velve.user(id)` that cascades on delete, so removing an
 * account while the reference stands would delete the editorial row as a side
 * effect — and with a seeded address in that column it would delete a member of
 * the editorial team.
 *
 * Every statement is confined to the mark, so an interrupted run can be swept
 * up by running this again and nothing else is ever in range.
 */
const removeShotAccounts = async () => {
  const marked = `${MARK}%`;

  // Before the author: `articles.author_id` restricts on delete, so an account
  // with a submission still in the queue cannot be removed at all.
  await pool.query(`delete from public.articles where slug like $1`, [marked]);
  await pool.query(
    `update public.users set velve_user_id = null where email like $1`,
    [marked],
  );
  await pool.query(`delete from velve."user" where email like $1`, [marked]);
  await pool.query(`delete from public.invitations where email like $1`, [marked]);
  await pool.query(`delete from public.users where email like $1`, [marked]);
};

/**
 * Signing in and getting refused both spend a token out of @velve/auth's own
 * bucket table, and its keys are hashes — nothing in them carries the mark. So
 * the keys that existed beforehand are remembered, and only the ones this run
 * brought into being are removed. A bucket that already existed and was merely
 * counted down is left alone: it is a counter that expires by itself, and
 * emptying it would be switching a lockout off rather than tidying up.
 */
const bucketKeys = async () => {
  const { rows } = await pool.query<{ bucket_key: string }>(
    `select bucket_key from velve.rate_bucket`,
  );
  return rows.map((row) => row.bucket_key);
};

const removeNewBuckets = async (known: readonly string[]) => {
  const { rowCount } = await pool.query(
    `delete from velve.rate_bucket where bucket_key <> all($1::text[])`,
    [known],
  );
  return rowCount ?? 0;
};

const readFixtures = async (invitationToken: string): Promise<Fixtures> => {
  const { rows: articles } = await pool.query<{ id: string; slug: string }>(
    `select id, slug from public.articles
     where status = 'published' and published_at <= now()
     order by published_at desc limit 1`,
  );
  const article = articles[0];
  if (article === undefined) {
    throw new Error("No published article to photograph.");
  }

  const { rows: subjects } = await pool.query<{ id: string }>(
    `select id from public.users where email = $1`,
    [SHOT_ACCOUNTS.subject.email],
  );
  const subjectId = subjects[0]?.id;
  if (subjectId === undefined) {
    throw new Error("The subject of screen 12a was not created.");
  }

  return {
    articleId: article.id,
    articleSlug: article.slug,
    subjectId,
    invitationToken,
  };
};

/**
 * The theme is stamped into storage before anything loads, and the emulated
 * system preference is pinned to light in every context, so that a dark shot is
 * dark because the choice says so and never because the machine taking it
 * happens to be.
 */
const openContext = async (
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  theme: ThemeName,
  width: Width,
  cookies: Awaited<ReturnType<BrowserContext["storageState"]>>["cookies"],
) =>
  browser.newContext({
    viewport: { width, height: width === 375 ? 812 : 900 },
    deviceScaleFactor: density[width],
    colorScheme: "light",
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    storageState: {
      cookies,
      origins: [
        {
          origin: BASE_URL,
          localStorage: [{ name: THEME_STORAGE_KEY, value: THEMES[theme] }],
        },
      ],
    },
  });

/** Fonts swapped in, entrance animations finished, nothing still in flight. */
const settle = async (page: Page) => {
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    );
  });
};

const capture = async (
  context: BrowserContext,
  screen: Screen,
  theme: ThemeName,
  width: Width,
) => {
  const page = await context.newPage();

  try {
    const response = await page.goto(`${BASE_URL}${screen.path}`, {
      waitUntil: "load",
    });
    const status = response?.status() ?? 0;
    if (status >= 400) {
      throw new Error(`${screen.path} answered ${status}`);
    }

    await settle(page);
    if (screen.reach !== undefined) {
      await screen.reach(page);
      await settle(page);
    }

    await page.screenshot({
      path: `${OUTPUT}${screen.id}-${theme}-${width}.png`,
      fullPage: true,
    });
  } finally {
    await page.close();
  }
};

/**
 * Redeems an invitation through the form, which is the only path that writes a
 * session cookie and the only path that brings the account into existence. The
 * photographer's cookies then serve every context that photographs a screen
 * behind the login; the subject's are thrown away, because all that account is
 * needed for is to have a password at all.
 */
const redeem = async (
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  token: string,
) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "de-DE",
  });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/admin/einladung/${token}`, { waitUntil: "load" });
    const password = shotPassword();
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="repeat"]', password);
    await page.click('button[type="submit"]');

    // The address it lands on, not a pattern: the page it starts on is also
    // under /admin, and a pattern would be satisfied before anything happened.
    await page
      .waitForURL(`${BASE_URL}/admin/artikel`, { waitUntil: "load", timeout: 20_000 })
      .catch(async (cause: unknown) => {
        const refusal = await page.$('[role="alert"]');
        if (refusal === null) throw cause;
        throw new Error(`The invitation was refused: ${await refusal.innerText()}`);
      });

    const { cookies } = await context.storageState();
    if (!cookies.some((cookie) => cookie.name.endsWith("velve_session"))) {
      throw new Error("Redeeming the invitation did not write a session cookie.");
    }

    return cookies;
  } finally {
    await context.close();
  }
};

const run = async () => {
  await rm(OUTPUT, { recursive: true, force: true });
  await mkdir(OUTPUT, { recursive: true });

  const bucketsBefore = await bucketKeys();

  // An interrupted run leaves its own rows behind, and they are the only rows
  // this may remove: every statement in there is confined to the mark.
  await removeShotAccounts();

  const invitationToken = await mintInvitation(SHOT_ACCOUNTS.photographer);
  const subjectToken = await mintInvitation(SHOT_ACCOUNTS.subject);
  const screens = screensOf(await readFixtures(invitationToken));
  const browser = await chromium.launch();
  let taken = 0;

  try {
    const pass = async (
      wanted: (screen: Screen) => boolean,
      cookies: Awaited<ReturnType<BrowserContext["storageState"]>>["cookies"],
    ) => {
      for (const theme of Object.keys(THEMES) as readonly ThemeName[]) {
        for (const width of WIDTHS) {
          const context = await openContext(browser, theme, width, cookies);
          try {
            for (const screen of screens.filter(wanted)) {
              await capture(context, screen, theme, width);
              taken += 1;
              console.log(
                `${screen.id}-${theme}-${width}  ${screen.path}  — ${screen.drawnAs}`,
              );
            }
          } finally {
            await context.close();
          }
        }
      }
    };

    // Public first, and 8b before anything is redeemed: an invitation is
    // single-use, and a shot account is on the masthead the moment it becomes
    // active, which /redaktion would photograph.
    await pass((screen) => !screen.session && screen.reach === undefined, []);

    const cookies = await redeem(browser, invitationToken);
    await redeem(browser, subjectToken);
    await writeSubmission();
    await pass((screen) => screen.session, cookies);

    await pass((screen) => !screen.session && screen.reach !== undefined, []);
  } finally {
    await browser.close();
    await removeShotAccounts();
    const swept = await removeNewBuckets(bucketsBefore);
    await pool.end();
    console.log(`\nRemoved both shot accounts and ${swept} rate buckets they created.`);
  }

  console.log(`${taken} screenshots in ${OUTPUT}`);
};

await run();
