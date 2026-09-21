import { redirect } from "next/navigation";

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ roadmapSlug: string }>;
}) {
  const { roadmapSlug } = await params;
  redirect(`/roadmaps/${roadmapSlug}/plan`);
}
