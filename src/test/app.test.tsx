import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";
import Arclight from "../components/Arclight";
import OrapaMine from "../components/OrapaMine";

describe("App", () => {
  it("renders Arclight when navigating to /arclight", () => {
    render(<Arclight />);
    expect(screen.getByText("Arclight")).toBeInTheDocument();
  });

  it("renders OrapaMine when navigating to /orapa-mine", () => {
    render(<OrapaMine />);
    expect(screen.getByText("Orapa Mine")).toBeInTheDocument();
  });

  it("opens the complete token catalog from the Orapa Street palette", () => {
    window.history.replaceState(null, "", "/");
    render(<App />);

    fireEvent.click(
      within(screen.getByRole("navigation")).getByRole("link", {
        name: "Orapa Street 221B",
      }),
    );
    fireEvent.click(
      screen.getByRole("link", { name: "View all tokens" }),
    );

    expect(
      screen.getByRole("heading", { name: "All Tokens" }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId(/^token-card-/)).toHaveLength(13);

    fireEvent.click(screen.getByTestId("token-card-red1"));
    const variants = screen.getAllByTestId(/^token-variant-/);
    expect(variants).toHaveLength(12);
    const lineDirections = variants
      .flatMap((variant) => Array.from(variant.querySelectorAll("line")))
      .map((line) => {
        const dx = Number(line.getAttribute("x2")) - Number(line.getAttribute("x1"));
        const dy = Number(line.getAttribute("y2")) - Number(line.getAttribute("y1"));
        return Math.sign(dx * dy);
      });
    expect(new Set(lineDirections)).toEqual(new Set([-1, 0, 1]));
    fireEvent.click(screen.getByRole("button", { name: "Back to All Tokens" }));
    expect(screen.getAllByTestId(/^token-card-/)).toHaveLength(13);

    fireEvent.click(screen.getByRole("link", { name: "Back to Puzzle" }));
    expect(
      screen.getByRole("heading", { name: "Orapa Street 221B" }),
    ).toBeInTheDocument();
  });
});
