import type { Metadata, Viewport } from "next";
import { BASE_HEX } from "@/lib/theme";
import "./globals.css";

/**
 * Adobe Fonts (Typekit) web project holding the Fiona family.
 *
 * Hardcoded rather than kept in an env var: a kit id is public by definition —
 * it ships in the stylesheet URL of every page that uses it — and baking it in
 * means the font works on any host without deploy configuration. The env var
 * still wins if one is set, for swapping kits without a code change.
 */
const TYPEKIT_ID = process.env.NEXT_PUBLIC_TYPEKIT_ID ?? "kuv1jiy";

export const metadata: Metadata = {
  title: "MINHO — Realtime · Motion·3D · UX·UI",
  description:
    "Kim Minho — designer working across realtime experience, motion·3D and UX·UI.",
  openGraph: {
    title: "MINHO",
    description: "Realtime Experience · Motion·3D · UX·UI",
    type: "website",
    /* Without this, pasting the address into a chat or a post produced a bare
       link with nothing to look at — which for a portfolio is the moment that
       matters most. One frame of the hero film, which is the site's face. */
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "MINHO" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MINHO",
    description: "Realtime Experience · Motion·3D · UX·UI",
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  /*
   * Without `width: device-width` a phone lays the page out at 980px and
   * scales the result down: the hero film reads as though it were zoomed in,
   * every label shrinks below legibility, and — worst of it — `innerWidth`
   * reports 980, so `view.mobile` (< 900) never became true and none of the
   * mobile branches in the engine or the components ever ran.
   */
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: BASE_HEX,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /* The interface is English throughout — every label, every control. Only
       the project write-ups are Korean, and those carry their own `lang`, so a
       screen reader switches voice for them instead of reading the whole
       chrome with the wrong one. */
    <html lang="en" style={{ background: BASE_HEX }}>
      <body style={{ background: BASE_HEX }}>
        {TYPEKIT_ID && (
          <>
            <link
              rel="preconnect"
              href="https://use.typekit.net"
              crossOrigin=""
            />
            <link
              rel="stylesheet"
              href={`https://use.typekit.net/${TYPEKIT_ID}.css`}
            />
          </>
        )}
        {children}
      </body>
    </html>
  );
}
