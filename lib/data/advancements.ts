import type { PixelIconName } from "@/lib/types";

/** Visitor advancements: earned by exploring this site, stored only in the visitor's browser. */
export type AdvancementId =
  | "title-screen"
  | "sound-on"
  | "inventory"
  | "first-world"
  | "world-hopper"
  | "multiplayer"
  | "message-sent"
  | "secret";

export interface Advancement {
  id: AdvancementId;
  title: string;
  description: string;
  icon: PixelIconName;
  hidden?: boolean;
}

export const advancements: Advancement[] = [
  { id: "title-screen", title: "Press Start", description: "Interact with the title screen", icon: "grass" },
  { id: "sound-on", title: "Turn It Up", description: "Enable game sounds", icon: "speaker" },
  { id: "inventory", title: "Taking Inventory", description: "Open the skills inventory", icon: "chest" },
  { id: "first-world", title: "First Steps", description: "Enter a world", icon: "map" },
  { id: "world-hopper", title: "World Hopper", description: "Enter every world", icon: "compass" },
  { id: "multiplayer", title: "Multiplayer", description: "Browse the server list", icon: "globe" },
  { id: "message-sent", title: "Message Delivered", description: "Send a message", icon: "mail" },
  { id: "secret", title: "Secret Seeker", description: "Find the hidden splash", icon: "star", hidden: true },
];
