import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProject, projects } from "@/lib/data/projects";
import { WorldDetail } from "@/components/projects/WorldDetail";
import { WorldLoading } from "@/components/projects/WorldLoading";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "World not found" };
  return { title: project.title, description: project.summary };
}

async function World({ params }: Pick<PageProps<"/projects/[slug]">, "params">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return <WorldDetail project={project} totalWorlds={projects.length} />;
}

export default function ProjectPage(props: PageProps<"/projects/[slug]">) {
  return (
    <Suspense fallback={<WorldLoading />}>
      <World params={props.params} />
    </Suspense>
  );
}
