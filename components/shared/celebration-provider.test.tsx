import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CelebrationProvider, useCelebration } from "@/components/shared/celebration-provider";

function Trigger() {
  const { celebrate } = useCelebration();
  return <button onClick={() => celebrate({ kind: "roadmap-complete", roadmapTitle: "Architecture" })}>Celebrate</button>;
}

describe("CelebrationProvider", () => {
  it("opens a milestone dialog", async () => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: vi.fn(() => null), configurable: true });
    render(<CelebrationProvider><Trigger /></CelebrationProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Celebrate" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByText("Roadmap complete")).toBeInTheDocument();
    expect(screen.getByText(/You completed every tracked step/)).toBeInTheDocument();
  });
});
