import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/login",
  useRouter: () => ({ push }),
}));

describe("LoginForm", () => {
  beforeEach(() => push.mockClear());

  it("accepts any non-empty credentials and navigates to roadmaps", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email or username/i), "anything");
    await user.type(screen.getByLabelText(/password/i), "x");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(push).toHaveBeenCalledWith("/roadmaps");
  });

  it("shows validation when credentials are empty", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText(/enter any email/i)).toBeInTheDocument();
    expect(screen.getByText(/enter any password/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
