import type { SiteConfig } from "@/lib/types";

/**
 * Site-wide configuration.
 * EDIT ME: replace the placeholders marked with [brackets].
 */
export const site: SiteConfig = {
  wordmark: "MINECRAFT",
  edition: "PORTFOLIO EDITION",
  version: "Portfolio Edition 1.0.0",
  disclaimer: "Not an official Minecraft product. Not affiliated with Mojang or Microsoft.",
  splashes: [
    "100% handcrafted!",
    "Now with sound!",
    "Press Enter to play!",
    "Built with Next.js!",
    "Made of pixels!",
    "Also try the projects!",
    "Contains no creepers!",
    "Type safe!",
    "Mind the gap!",
    "Hello, traveller!",
    "Open the inventory!",
    "Joins servers!",
  ],
  // EDIT ME: add your public email to enable the mailto fallback, e.g. "you@example.com".
  contactEmail: undefined,
  // EDIT ME: your deployed URL (used for metadata).
  siteUrl: "http://localhost:3000",
  description:
    "A personal portfolio presented as a block-game title screen: explore worlds, open the inventory and join the servers.",
};
