import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const { signInWithOAuth } = vi.hoisted(() => ({ signInWithOAuth: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth } }),
}));

describe("LoginForm", () => {
  beforeEach(() => { signInWithOAuth.mockReset(); signInWithOAuth.mockResolvedValue({ error: null }); });

  it("starts GitHub OAuth with the app callback", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /continue with github/i }));
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/roadmaps` },
    });
  });

  it("shows provider errors and allows the user to retry", async () => {
    const user = userEvent.setup();
    signInWithOAuth.mockResolvedValueOnce({ error: new Error("GitHub provider is unavailable") });
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /continue with github/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("GitHub provider is unavailable");
    expect(screen.getByRole("button", { name: /continue with github/i })).toBeEnabled();
  });
});
