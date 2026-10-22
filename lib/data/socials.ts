import type { SocialLink } from "@/lib/types";

/**
 * Servers shown on /socials.
 *
 * EDIT ME: add your real profile URL to `url` (and optionally `username`).
 * Entries without a url show as "Can't connect to server" and cannot be joined.
 * Delete the platforms you don't use.
 */
export const socials: SocialLink[] = [
  {
    id: "github",
    platform: "GitHub",
    icon: "github",
    url: undefined,
    username: undefined,
    description: "Source code, experiments and open-source contributions.",
  },
  {
    id: "linkedin",
    platform: "LinkedIn",
    icon: "linkedin",
    url: undefined,
    username: undefined,
    description: "Professional profile and work history.",
  },
  {
    id: "instagram",
    platform: "Instagram",
    icon: "instagram",
    url: undefined,
    username: undefined,
    description: "Visual work and behind-the-scenes.",
  },
  {
    id: "youtube",
    platform: "YouTube",
    icon: "youtube",
    url: undefined,
    username: undefined,
    description: "Videos, edits and tutorials.",
  },
];
