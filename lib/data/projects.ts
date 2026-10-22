import type { Project } from "@/lib/types";

/**
 * Worlds shown on /projects. Each entry gets its own /projects/[slug] route.
 *
 * EDIT ME: replace the "New World" placeholders with your real projects.
 * - Never put a liveUrl / sourceUrl here that does not exist; leave it undefined
 *   and the matching button is disabled.
 * - `cover` and `gallery` images go in /public/images/projects/ and need their
 *   real pixel width/height so next/image can reserve space.
 */
export const projects: Project[] = [
  {
    slug: "portfolio-edition",
    title: "Portfolio Edition",
    summary: "This site: a block-game title screen turned into a portfolio.",
    description:
      "A personal portfolio that behaves like a game menu. Every section is a real route: worlds for projects, an inventory for skills, a multiplayer list for socials and a book & quill for messages.",
    objective:
      "Make a portfolio that feels like launching a game instead of scrolling a landing page, without giving up accessibility, real routing or performance.",
    category: "Web Development",
    mode: "Creative",
    status: "in-progress",
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "GSAP", "Lenis", "Three.js", "Web Audio"],
    cover: {
      src: "/images/projects/portfolio-edition-title.webp",
      alt: "The title screen: a stone wordmark and menu buttons over a voxel landscape",
      width: 1440,
      height: 810,
    },
    gallery: [
      {
        src: "/images/projects/portfolio-edition-title.webp",
        alt: "Title screen with the main menu",
        width: 1440,
        height: 810,
        caption: "Title screen over the generated panorama",
      },
      {
        src: "/images/projects/portfolio-edition-inventory.webp",
        alt: "Skills shown as items in an inventory, with a player model and item details",
        width: 1440,
        height: 810,
        caption: "Skills as an inventory",
      },
    ],
  },
  {
    slug: "new-world",
    title: "New World",
    summary: "An empty save slot waiting for your next project.",
    description:
      "[Describe the project here: what it is, who it is for and what makes it interesting.]",
    objective: "[The problem this project solves or the creative goal behind it.]",
    category: "[Category]",
    mode: "Survival",
    status: "placeholder",
    tech: [],
    gallery: [],
    placeholder: true,
  },
  {
    slug: "new-world-1",
    title: "New World (1)",
    summary: "Another empty save slot. Add a project in lib/data/projects.ts.",
    description:
      "[Describe the project here: what it is, who it is for and what makes it interesting.]",
    objective: "[The problem this project solves or the creative goal behind it.]",
    category: "[Category]",
    mode: "Adventure",
    status: "placeholder",
    tech: [],
    gallery: [],
    placeholder: true,
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const statusLabel: Record<Project["status"], string> = {
  released: "Released",
  "in-progress": "In Progress",
  prototype: "Prototype",
  archived: "Archived",
  placeholder: "Empty Slot",
};
