import type { Metadata } from "next";
import { skillCategories, skills } from "@/lib/data/skills";
import { Inventory } from "@/components/inventory/Inventory";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Skills and tools, laid out as an inventory.",
};

export default function SkillsPage() {
  return <Inventory skills={skills} categories={skillCategories} />;
}
