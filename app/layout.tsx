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
  },
};

export const viewport: Viewport = {
  themeColor: BASE_HEX,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" style={{ background: BASE_HEX }}>
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
