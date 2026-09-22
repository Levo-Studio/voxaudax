import type { CSSProperties, ReactNode } from "react";
import { Body, Head, Html, Img, Link, Preview } from "@react-email/components";

import {
  MAIL_WIDTH_PX,
  fontStack,
  monoStack,
  palette,
} from "@/lib/mail/theme";

const { light, dark } = palette;

/**
 * Inline styles carry the light design; this sheet only restates it in the dark
 * palette. `color-scheme` is declared as well, so a client that understands it
 * renders these colours instead of inverting the light ones into mud — and the
 * classes are named after the role they paint, so the two palettes stay
 * legible side by side.
 *
 * Where a client ignores both and force-inverts anyway (Gmail on Android), the
 * design still holds: every pairing here keeps its contrast under inversion,
 * and the accent is a saturated mid-tone rather than a near-white or
 * near-black, which is what such clients repaint hardest.
 */
const darkPalette = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; margin: 0; padding: 0; }
  table { border-collapse: collapse; }
  img { -ms-interpolation-mode: bicubic; }
  @media (prefers-color-scheme: dark) {
    .va-page { background: ${dark.surfaceSunken} !important; }
    .va-card, .va-surface { background: ${dark.surface} !important; }
    .va-sunken { background: ${dark.surfaceSunken} !important; }
    .va-text { color: ${dark.text} !important; }
    .va-muted { color: ${dark.textMuted} !important; }
    .va-border { border-color: ${dark.border} !important; }
    .va-accent { color: ${dark.accent} !important; }
    .va-action { background: ${dark.accent} !important; color: ${dark.onAccent} !important; }
    /* The label only. Painting a background on it too would lay a square over
       the rounded cell underneath and square the button off. */
    .va-action-label { color: ${dark.onAccent} !important; }
  }
`;

const pageStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  width: "100%",
  backgroundColor: light.surfaceSunken,
  color: light.text,
  fontFamily: fontStack,
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: `${MAIL_WIDTH_PX}px`,
  backgroundColor: light.surface,
  border: `1px solid ${light.border}`,
  borderRadius: "12px",
};

export const bodyTextStyle: CSSProperties = {
  margin: 0,
  fontFamily: fontStack,
  fontSize: "14.5px",
  lineHeight: "1.65",
  fontWeight: 500,
  color: light.text,
};

export const mutedTextStyle: CSSProperties = {
  margin: 0,
  fontFamily: fontStack,
  fontSize: "12.5px",
  lineHeight: "1.6",
  fontWeight: 500,
  color: light.textMuted,
};

type BlockProps = { children: ReactNode; spaced?: boolean };

const spacing = (spaced: boolean | undefined) =>
  spaced === false ? "0" : "14px";

export const Paragraph = ({ children, spaced }: BlockProps) => (
  <p style={{ ...bodyTextStyle, marginTop: spacing(spaced) }} className="va-text">
    {children}
  </p>
);

export const Note = ({ children, spaced }: BlockProps) => (
  <p style={{ ...mutedTextStyle, marginTop: spacing(spaced) }} className="va-muted">
    {children}
  </p>
);

export const Emphasis = ({ children }: { children: ReactNode }) => (
  <strong style={{ fontWeight: 700 }}>{children}</strong>
);

/**
 * The closing remark and the line above it, which the design draws as one
 * paragraph with a border on its top edge rather than as a rule followed by
 * text. Built that way here too: a separate rule would need its own margin on
 * both sides, and the two would then have to be kept in step by hand.
 *
 * A border on a `p` is one of the few pieces of CSS every mail client renders,
 * so it needs no table around it.
 */
export const ClosingNote = ({ children }: { children: ReactNode }) => (
  <p
    style={{
      ...mutedTextStyle,
      marginTop: "12px",
      paddingTop: "12px",
      borderTop: `1px solid ${light.border}`,
    }}
    className="va-muted va-border"
  >
    {children}
  </p>
);

/** A rule that separates a closing remark from the message above it. */
export const PartingRule = () => (
  <table
    role="presentation"
    width="100%"
    cellPadding={0}
    cellSpacing={0}
    border={0}
    style={{ width: "100%", marginTop: "12px" }}
  >
    <tbody>
      <tr>
        <td
          style={{
            borderTop: `1px solid ${light.border}`,
            fontSize: "1px",
            lineHeight: "1px",
          }}
          className="va-border"
        >
          &nbsp;
        </td>
      </tr>
    </tbody>
  </table>
);

export type Fact = { label: string; value: string };

/**
 * The design sets the label column of each screen to its own width — 74px on
 * the article, 96px on the meme, 110px on the password notice — so that the
 * values line up under one another without the longest label pushing them
 * across. It is the caller's measurement, not a guess made from the text.
 */
export const FactList = ({
  facts,
  labelWidth,
}: {
  facts: readonly Fact[];
  labelWidth: number;
}) => (
  <table
    role="presentation"
    width="100%"
    cellPadding={0}
    cellSpacing={0}
    border={0}
    style={{
      width: "100%",
      marginTop: "14px",
      border: `1px solid ${light.border}`,
      borderRadius: "10px",
    }}
    className="va-border"
  >
    <tbody>
      {facts.map((fact, index) => (
        <tr key={fact.label}>
          <td
            width={labelWidth}
            style={{
              paddingTop: index === 0 ? "12px" : 0,
              paddingBottom: index === facts.length - 1 ? "12px" : 0,
              paddingLeft: "14px",
              paddingRight: "10px",
              fontFamily: fontStack,
              fontSize: "13px",
              lineHeight: "1.7",
              fontWeight: 600,
              color: light.textMuted,
              whiteSpace: "nowrap",
              verticalAlign: "top",
            }}
            className="va-muted"
          >
            {fact.label}
          </td>
          <td
            style={{
              paddingTop: index === 0 ? "12px" : 0,
              paddingBottom: index === facts.length - 1 ? "12px" : 0,
              paddingRight: "14px",
              fontFamily: fontStack,
              fontSize: "13px",
              lineHeight: "1.7",
              fontWeight: 600,
              color: light.text,
              verticalAlign: "top",
            }}
            className="va-text"
          >
            {fact.value}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

/**
 * A table rather than a styled anchor: Outlook renders padding on an inline
 * element as nothing at all, so the coloured area has to be a cell.
 */
export const ActionButton = ({ href, label }: { href: string; label: string }) => (
  <table
    role="presentation"
    cellPadding={0}
    cellSpacing={0}
    border={0}
    style={{ marginTop: "14px" }}
  >
    <tbody>
      <tr>
        <td
          align="center"
          style={{
            backgroundColor: light.accent,
            borderRadius: "9px",
          }}
          className="va-action"
        >
          <Link
            href={href}
            style={{
              display: "inline-block",
              padding: "11px 18px",
              fontFamily: fontStack,
              fontSize: "13.5px",
              fontWeight: 700,
              lineHeight: "1",
              color: light.onAccent,
              textDecoration: "none",
            }}
            className="va-action-label"
          >
            {label}
          </Link>
        </td>
      </tr>
    </tbody>
  </table>
);

/** The same destination in full, for anyone whose client swallows the button. */
export const SpelledOutLink = ({ href }: { href: string }) => (
  <p
    style={{
      margin: "12px 0 0",
      fontFamily: monoStack,
      fontSize: "11.5px",
      lineHeight: "1.5",
      color: light.textMuted,
      wordBreak: "break-all",
    }}
    className="va-muted"
  >
    <Link href={href} style={{ color: "inherit", textDecoration: "none" }}>
      {href}
    </Link>
  </p>
);

export type PreviewImage = {
  /** Absolute, because a mail has no origin to resolve a path against. */
  url: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * Flush to the card's edges, between the header and the body — where 11b draws
 * the approved meme. No padding and no rounding of its own: the card clips it,
 * and a line underneath separates it from the first sentence.
 */
export const BannerImage = ({ image }: { image: PreviewImage }) => {
  const width = MAIL_WIDTH_PX;
  const height = Math.round((image.height / image.width) * width);

  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{ width: "100%" }}
    >
      <tbody>
        <tr>
          <td
            align="center"
            style={{
              backgroundColor: light.surfaceSunken,
              borderBottom: `1px solid ${light.border}`,
              fontSize: 0,
              lineHeight: 0,
            }}
            className="va-sunken va-border"
          >
            <Img
              src={image.url}
              alt={image.alt}
              width={width}
              height={height}
              style={{
                display: "block",
                width: "100%",
                maxWidth: `${width}px`,
                height: "auto",
              }}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

type ShellProps = {
  preheader: string;
  addressLine: string;
  subject: string;
  banner?: ReactNode;
  children: ReactNode;
};

/**
 * The card the design draws, and nothing around it. It carried a VOX AUDAX
 * wordmark and a footer for a while, on the reasoning that a mail standing
 * alone in an inbox has to name its sender — the design shows neither, and the
 * decision was overruled: this is what the mail looks like.
 *
 * So the grey "An …" line and the subject above the message, which had been
 * read as the mock header of a mail programme, are part of the message after
 * all. They are drawn here, once, for every template.
 */
export const MailShell = ({
  preheader,
  addressLine,
  subject,
  banner,
  children,
}: ShellProps) => (
  <Html lang="de" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light dark" />
      <meta name="supported-color-schemes" content="light dark" />
      <style dangerouslySetInnerHTML={{ __html: darkPalette }} />
    </Head>
    <Preview>{preheader}</Preview>
    <Body style={pageStyle} className="va-page">
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        style={{ width: "100%", backgroundColor: light.surfaceSunken }}
        className="va-page"
      >
        <tbody>
          <tr>
            <td align="center" style={{ padding: "24px 12px" }}>
              <table
                role="presentation"
                width={MAIL_WIDTH_PX}
                cellPadding={0}
                cellSpacing={0}
                border={0}
                align="center"
                style={cardStyle}
                className="va-card va-border"
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: "14px 18px",
                        borderBottom: `1px solid ${light.border}`,
                        fontFamily: fontStack,
                        fontSize: "12px",
                        lineHeight: "1.5",
                        fontWeight: 600,
                        color: light.textMuted,
                      }}
                      className="va-muted va-border"
                    >
                      {addressLine}
                      <br />
                      <span
                        style={{
                          fontFamily: fontStack,
                          fontSize: "13.5px",
                          fontWeight: 700,
                          color: light.text,
                        }}
                        className="va-text"
                      >
                        {subject}
                      </span>
                    </td>
                  </tr>
                  {banner === undefined || banner === null ? null : (
                    <tr>
                      <td style={{ padding: 0 }}>{banner}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: "18px", fontFamily: fontStack }}>
                      {children}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </Body>
  </Html>
);
