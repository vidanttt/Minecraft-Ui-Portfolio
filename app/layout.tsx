import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site } from "@/lib/data/site";
import { GameProviders } from "@/components/game/GameProviders";
import { PanoramaBackground } from "@/components/menu/PanoramaBackground";
import "./globals.css";

const blockfolio = localFont({
  src: [
    { path: "./fonts/Blockfolio-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Blockfolio-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-blockfolio",
  display: "block",
  preload: true,
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: {
    default: "Portfolio Edition – Title Screen",
    template: "%s – Portfolio Edition",
  },
  description: site.description,
  applicationName: "Portfolio Edition",
  openGraph: {
    title: "Portfolio Edition",
    description: site.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#26262c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={blockfolio.variable}>
      <body>
        <GameProviders>
          <PanoramaBackground />
          {children}
        </GameProviders>
      </body>
    </html>
  );
}
