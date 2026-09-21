import type { Metadata } from "next";
import { ResourceDetail } from "@/components/plan/resource-detail";
export const metadata: Metadata = { title: "Resource" };
export default async function Page({ params }: { params: Promise<{ resourceId: string }> }) { const { resourceId } = await params; return <ResourceDetail resourceId={resourceId} />; }
