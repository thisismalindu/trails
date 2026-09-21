import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/persistence/database.types";
import { loadRoadmapSummaries, TrailsRepositoryError } from "./supabase-repository";

const summaryRow = {
  id: "55d45eda-d522-4c6a-b2d0-594a76da346f",
  slug: "modern-web",
  title: "Modern Web",
  objective: "Build a reliable web application.",
  updated_at: "2026-09-21T12:00:00.000Z",
  archived_at: null,
  revision: "3",
  progress_complete: 2,
  progress_total: 5,
  resource_count: "4",
};

function clientWithRpc(result: unknown) {
  return {
    rpc: vi.fn().mockResolvedValue(result),
  } as unknown as SupabaseClient<Database>;
}

describe("Supabase repository boundary", () => {
  it("parses and maps summary rows returned from the Data API", async () => {
    const client = clientWithRpc({ data: [summaryRow], error: null });
    await expect(loadRoadmapSummaries(client)).resolves.toEqual([{
      id: summaryRow.id,
      slug: summaryRow.slug,
      title: summaryRow.title,
      objective: summaryRow.objective,
      updatedAt: summaryRow.updated_at,
      archivedAt: null,
      revision: 3,
      progress: { complete: 2, total: 5, percent: 40 },
      resourceCount: 4,
    }]);
  });

  it("rejects malformed rows and maps database failures into repository categories", async () => {
    await expect(loadRoadmapSummaries(clientWithRpc({ data: [{ ...summaryRow, progress_complete: 8 }], error: null })))
      .rejects.toMatchObject({ kind: "invalid" });
    await expect(loadRoadmapSummaries(clientWithRpc({ data: null, error: { code: "42501", message: "denied" } })))
      .rejects.toMatchObject({ kind: "unauthorized" });
    await expect(loadRoadmapSummaries(clientWithRpc({ data: null, error: { code: "40001", message: "stale" } })))
      .rejects.toMatchObject({ kind: "conflict" });
    await expect(loadRoadmapSummaries(clientWithRpc({ data: null, error: { code: "23514", message: "invalid document" } })))
      .rejects.toMatchObject({ kind: "invalid" });
    await expect(loadRoadmapSummaries(clientWithRpc({ data: null, error: { code: "ECONNRESET", message: "offline" } })))
      .rejects.toMatchObject({ kind: "network" });
  });

  it("treats an empty RPC result as not found rather than an empty summary list", async () => {
    const promise = loadRoadmapSummaries(clientWithRpc({ data: null, error: null }));
    await expect(promise)
      .rejects.toBeInstanceOf(TrailsRepositoryError);
    await expect(promise).rejects.toMatchObject({ kind: "not-found" });
  });
});
