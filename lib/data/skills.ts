import type { Skill, SkillCategory } from "@/lib/types";

/**
 * Inventory shown on /skills.
 *
 * EDIT ME: these items are pre-filled from the stack this portfolio is built
 * with. Remove anything you do not actually use, add your own, and only set
 * `level` if you want to show a self-rating.
 */
export const skillCategories: SkillCategory[] = [
  { id: "frontend", label: "Frontend", icon: "compass" },
  { id: "languages", label: "Languages", icon: "book" },
  { id: "motion-3d", label: "Motion & 3D", icon: "star" },
  { id: "tools", label: "Tools", icon: "pickaxe" },
];

export const skills: Skill[] = [
  {
    id: "react",
    name: "React",
    category: "frontend",
    icon: "react",
    description: "Component-based interfaces with hooks and a clear data flow.",
    related: ["Next.js", "TypeScript"],
    equipped: true,
  },
  {
    id: "nextjs",
    name: "Next.js",
    category: "frontend",
    icon: "nextjs",
    description: "App Router, server components, static generation and route handlers.",
    related: ["React", "Vercel"],
    equipped: true,
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    category: "frontend",
    icon: "tailwind",
    description: "Utility-first styling backed by design tokens.",
    related: ["CSS"],
  },
  {
    id: "html",
    name: "HTML",
    category: "frontend",
    icon: "html",
    description: "Semantic, accessible markup.",
  },
  {
    id: "css",
    name: "CSS",
    category: "frontend",
    icon: "css",
    description: "Layout, custom properties and hand-built pixel bevels like the ones on this page.",
  },
  {
    id: "typescript",
    name: "TypeScript",
    category: "languages",
    icon: "typescript",
    description: "Strictly typed data models, components and utilities.",
    related: ["JavaScript"],
    equipped: true,
  },
  {
    id: "javascript",
    name: "JavaScript",
    category: "languages",
    icon: "javascript",
    description: "The language of the web, from DOM work to Web Audio.",
  },
  {
    id: "gsap",
    name: "GSAP",
    category: "motion-3d",
    icon: "gsap",
    description: "Timeline-based animation for transitions and micro-interactions.",
    related: ["Lenis"],
    equipped: true,
  },
  {
    id: "threejs",
    name: "Three.js",
    category: "motion-3d",
    icon: "threejs",
    description: "WebGL scenes, such as the voxel panorama behind this menu.",
  },
  {
    id: "git",
    name: "Git",
    category: "tools",
    icon: "git",
    description: "Version control and collaboration.",
  },
];
