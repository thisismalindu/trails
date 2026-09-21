import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { JsonImportPanel } from "@/components/shared/json-import-panel";
import { progressSchema } from "@/lib/schemas";
import type { ProgressData } from "@/lib/types";

describe("JsonImportPanel", () => {
  it("changes the copy action to Copied after a successful clipboard write", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <JsonImportPanel<ProgressData>
        kind="progress"
        prompt="Generate JSON"
        schema={progressSchema}
        onConfirm={vi.fn()}
        summary={() => null}
      />,
    );

    await user.click(screen.getByRole("button", { name: /copy prompt/i }));
    expect(writeText).toHaveBeenCalledWith("Generate JSON");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("keeps invalid data untouched and confirms valid data", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <JsonImportPanel<ProgressData>
        kind="progress"
        prompt="Generate JSON"
        schema={progressSchema}
        onConfirm={onConfirm}
        summary={(data) => <span>{data.sections.length} sections</span>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /import json/i }));
    const input = screen.getByLabelText("Paste progress JSON");
    await user.type(input, "not json");
    await user.click(screen.getByRole("button", { name: /^preview$/i }));
    expect(screen.getByText(/not valid JSON/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    const valid = JSON.stringify({
      version: 1,
      sections: [
        {
          id: "s1",
          title: "Section",
          items: [{ id: "i1", label: "Step", status: "not-started" }],
        },
      ],
    });
    await user.clear(input);
    fireEvent.change(input, { target: { value: valid } });
    await user.click(screen.getByRole("button", { name: /^preview$/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /confirm import/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
