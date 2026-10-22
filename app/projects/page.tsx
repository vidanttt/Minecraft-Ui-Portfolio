import type { Metadata } from "next";
import { projects } from "@/lib/data/projects";
import { WorldSelection } from "@/components/projects/WorldSelection";

export const metadata: Metadata = {
  title: "Select World",
  description: "Projects, presented as worlds to explore.",
};

export default function ProjectsPage() {
  return <WorldSelection projects={projects} />;
}
