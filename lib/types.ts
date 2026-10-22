/** Shared data models for the portfolio. Content lives in lib/data/*. */

export type PixelIconName =
  | "react"
  | "nextjs"
  | "typescript"
  | "javascript"
  | "tailwind"
  | "threejs"
  | "gsap"
  | "html"
  | "css"
  | "git"
  | "node"
  | "figma"
  | "blender"
  | "brush"
  | "film"
  | "book"
  | "compass"
  | "chest"
  | "pickaxe"
  | "star"
  | "github"
  | "linkedin"
  | "instagram"
  | "youtube"
  | "x"
  | "globe"
  | "mail"
  | "speaker"
  | "speakerOff"
  | "person"
  | "gear"
  | "map"
  | "heart"
  | "lock"
  | "grass";

export interface PlayerProfile {
  /** In-game name shown on the name tag. */
  playerName: string;
  /** Full or display name. */
  displayName: string;
  /** One or two sentences. */
  intro: string;
  /** e.g. "Frontend developer & 3D hobbyist" */
  identity: string;
  currentQuest: string;
  playStyle: string;
  specialAbilities: string[];
  interests: string[];
  approach: string;
  location?: string;
  milestones: Milestone[];
  /** Colours used by the pixel avatar. */
  avatar: AvatarPalette;
}

export interface Milestone {
  title: string;
  description: string;
  icon: PixelIconName;
  /** Optional year or date label. Leave undefined if unknown. */
  when?: string;
}

export interface AvatarPalette {
  skin: string;
  hair: string;
  shirt: string;
  shirtAccent: string;
  pants: string;
  shoes: string;
  eyes: string;
}

export type ProjectStatus = "released" | "in-progress" | "prototype" | "archived" | "placeholder";

export type GameModeLabel = "Survival" | "Creative" | "Adventure" | "Hardcore" | "Custom Map";

export interface ProjectLink {
  label: string;
  href: string;
}

export interface ProjectMedia {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}

export interface Project {
  slug: string;
  title: string;
  /** Short line for the world list. */
  summary: string;
  description: string;
  objective?: string;
  category: string;
  /** Playful presentation label; pick one that fits the project. */
  mode: GameModeLabel;
  year?: string;
  status: ProjectStatus;
  tech: string[];
  /** Thumbnail / hero art. Leave undefined to use the generated world icon. */
  cover?: ProjectMedia;
  gallery: ProjectMedia[];
  liveUrl?: string;
  sourceUrl?: string;
  extraLinks?: ProjectLink[];
  /** Placeholder entries render as empty save slots. */
  placeholder?: boolean;
}

export type SkillCategoryId =
  | "frontend"
  | "languages"
  | "motion-3d"
  | "tools"
  | "design"
  | "backend";

export interface SkillCategory {
  id: SkillCategoryId;
  label: string;
  icon: PixelIconName;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategoryId;
  icon: PixelIconName;
  description: string;
  /** Only set when you have a meaningful self-rating (1-5). */
  level?: 1 | 2 | 3 | 4 | 5;
  related?: string[];
  /** Shown in the armour slots beside the player. Max 4. */
  equipped?: boolean;
}

export interface SocialLink {
  id: string;
  platform: string;
  icon: PixelIconName;
  /** Leave undefined until you have a real profile URL. */
  url?: string;
  username?: string;
  description: string;
}

export interface SiteConfig {
  /** Big blocky wordmark on the title screen. */
  wordmark: string;
  /** Banner under the wordmark. */
  edition: string;
  version: string;
  disclaimer: string;
  splashes: string[];
  /** Used as a mailto fallback on the contact screen. Leave undefined to hide. */
  contactEmail?: string;
  siteUrl: string;
  description: string;
}
