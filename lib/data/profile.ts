import type { PlayerProfile } from "@/lib/types";

/**
 * Player profile shown on /about.
 * EDIT ME: every value in [brackets] is a placeholder waiting for your real details.
 */
export const profile: PlayerProfile = {
  playerName: "Player",
  displayName: "[Your Name]",
  intro: "[A short introduction: who you are and what you love to build.]",
  identity: "[Your creative or technical identity, e.g. Frontend Developer]",
  currentQuest: "[What you are working on or learning right now]",
  playStyle: "[How you like to work: curious, methodical, experimental...]",
  specialAbilities: ["[Strength one]", "[Strength two]", "[Strength three]"],
  interests: ["[Interest one]", "[Interest two]", "[Interest three]"],
  approach: "[Your personal approach to creating things, in a sentence or two.]",
  location: undefined,
  milestones: [
    {
      title: "[Milestone title]",
      description: "[Something you achieved. Leave out anything you would not put on a CV.]",
      icon: "star",
    },
    {
      title: "Built this portfolio",
      description: "A block-game title screen with worlds, an inventory and servers.",
      icon: "pickaxe",
    },
  ],
  avatar: {
    skin: "#d5a27c",
    hair: "#1f1a17",
    shirt: "#7a2633",
    shirtAccent: "#e0b44c",
    pants: "#34343d",
    shoes: "#e8e8e8",
    eyes: "#3b2a1a",
  },
};
