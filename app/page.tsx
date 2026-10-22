import type { Metadata } from "next";
import { MainMenu } from "@/components/menu/MainMenu";

export const metadata: Metadata = {
  title: { absolute: "Portfolio Edition – Title Screen" },
};

export default function HomePage() {
  return <MainMenu />;
}
