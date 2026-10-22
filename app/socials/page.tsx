import type { Metadata } from "next";
import { socials } from "@/lib/data/socials";
import { ServerList } from "@/components/socials/ServerList";

export const metadata: Metadata = {
  title: "Multiplayer",
  description: "Social profiles, listed as multiplayer servers.",
};

export default function SocialsPage() {
  return <ServerList socials={socials} />;
}
