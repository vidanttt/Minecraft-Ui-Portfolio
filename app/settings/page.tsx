import type { Metadata } from "next";
import { OptionsScreen } from "@/components/settings/OptionsScreen";

export const metadata: Metadata = {
  title: "Options",
  description: "Sound, music, graphics and accessibility settings.",
};

export default function SettingsPage() {
  return <OptionsScreen />;
}
