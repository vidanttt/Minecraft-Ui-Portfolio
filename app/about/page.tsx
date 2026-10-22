import type { Metadata } from "next";
import { profile } from "@/lib/data/profile";
import { PlayerProfile } from "@/components/about/PlayerProfile";

export const metadata: Metadata = {
  title: "Player Profile",
  description: "Who is behind this portfolio.",
};

export default function AboutPage() {
  return <PlayerProfile profile={profile} />;
}
