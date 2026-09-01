import type { Metadata, Viewport } from "next";
import { BASE_HEX } from "@/lib/theme";
import "./globals.css";

/**
 * TODO_ASSET — Adobe Fonts (Typekit) web project id for the Fiona family.
 * Create a web project at fonts.adobe.com containing "Fiona", then put its kit
 * id in .env.local as NEXT_PUBLIC_TYPEKIT_ID. Until it is set nothing is
 * requested and the serif fallback stack in globals.css is used.
 */
const TYPEKIT_ID = process.env.NEXT_PUBLIC_TYPEKIT_ID;

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
