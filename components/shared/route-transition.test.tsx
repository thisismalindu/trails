import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PresenceSwap } from "@/components/shared/route-transition";

function Harness({ route }: { route: string }) {
  return (
    <PresenceSwap transitionKey={route}>
      <div>{route}</div>
    </PresenceSwap>
  );
}

describe("PresenceSwap", () => {
  afterEach(() => vi.restoreAllMocks());

  it("always moves the new view in from the right and the old view to the left", () => {
    const animate = vi.fn((keyframes: Keyframe[], options?: KeyframeAnimationOptions) => ({
      cancel: vi.fn(),
      finished: new Promise(() => {}),
      keyframes,
      options,
    }));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    const view = render(<Harness route="quiz" />);
    view.rerender(<Harness route="plan" />);

    expect(animate.mock.calls[0][0]).toEqual([
      { opacity: 0.2, transform: "translate3d(14px, 0, 0)" },
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
    ]);
    expect(animate.mock.calls[1][0]).toEqual([
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
      { opacity: 0, transform: "translate3d(-8px, 0, 0)" },
    ]);
  });

  it("retains an inert outgoing view until the committed animation finishes", async () => {
    let resolveAnimation = () => {};
    const finished = new Promise<void>((resolve) => {
      resolveAnimation = resolve;
    });
    const cancel = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value: vi.fn(() => ({ cancel, finished })),
    });

    const view = render(<Harness route="plan" />);
    view.rerender(<Harness route="progress" />);
    const outgoing = view.container.querySelector(".presence-swap__outgoing");
    expect(outgoing).toHaveAttribute("aria-hidden", "true");
    expect(outgoing).toHaveAttribute("inert");
    expect(outgoing).toHaveTextContent("plan");
    expect(view.container.querySelector(".presence-swap__current")).toHaveTextContent("progress");

    await act(async () => resolveAnimation());
    await waitFor(() => expect(view.container.querySelector(".presence-swap__outgoing")).not.toBeInTheDocument());
    expect(cancel).toHaveBeenCalled();
  });

  it("cancels stale motion during rapid navigation and keeps the latest route", () => {
    const cancel = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value: vi.fn(() => ({ cancel, finished: new Promise(() => {}) })),
    });

    const view = render(<Harness route="plan" />);
    view.rerender(<Harness route="progress" />);
    view.rerender(<Harness route="quiz" />);
    expect(cancel).toHaveBeenCalled();
    expect(view.container.querySelector(".presence-swap__current")).toHaveTextContent("quiz");
    expect(view.container.querySelector(".presence-swap__outgoing")).toHaveTextContent("progress");
    expect(screen.queryByText("plan")).not.toBeInTheDocument();
  });

  it("uses a short opacity handoff for reduced-motion users", async () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const animate = vi.fn((keyframes: Keyframe[], options?: KeyframeAnimationOptions) => ({
      cancel: vi.fn(),
      finished: Promise.resolve(),
      keyframes,
      options,
    }));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });

    const view = render(<Harness route="plan" />);
    view.rerender(<Harness route="progress" />);
    await waitFor(() => expect(animate).toHaveBeenCalled());
    expect(animate.mock.calls[0][1]).toMatchObject({ duration: 110 });
    expect(animate.mock.calls[0][0]).toEqual([{ opacity: 0.35 }, { opacity: 1 }]);
  });
});
