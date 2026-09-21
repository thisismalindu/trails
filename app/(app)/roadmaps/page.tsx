import type { Metadata } from "next";
import { RoadmapChooser } from "@/components/roadmaps/roadmap-chooser";

export const metadata: Metadata = { title: "Roadmaps" };

export default function RoadmapsPage() {
  return <RoadmapChooser />;
}
