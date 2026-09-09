import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlatformOverview from "./PlatformOverview";
import SkillsJourney from "./SkillsJourney";
import TechSpotlight from "./TechSpotlight";
import TechUniverse from "./TechUniverse";

describe("public static sections", () => {
  test("renders platform overview content and technology pills", () => {
    render(<PlatformOverview />);

    expect(screen.getAllByText("CodeQuest")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Master Frontend Development/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("HTML")).toBeInTheDocument();
    expect(screen.getByText("AI Assistance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
  });

  test("renders technology universe code sample", () => {
    render(<TechUniverse />);

    expect(screen.getByText("codeblock.js")).toBeInTheDocument();
    expect(screen.getByText(/learnCoding/)).toBeInTheDocument();
    expect(screen.getByText(/JavaScript/)).toBeInTheDocument();
  });

  test("renders and changes tech spotlight cards", async () => {
    const user = userEvent.setup();
    render(<TechSpotlight />);

    expect(screen.getByRole("heading", { name: "Tech Spotlight" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "HTML" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to spotlight 4" }));
    expect(screen.getByRole("heading", { name: "React" })).toBeInTheDocument();
  });

  test("renders and changes learning journey levels", async () => {
    const user = userEvent.setup();
    render(<SkillsJourney />);

    expect(screen.getByRole("heading", { name: "Your Learning Journey" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "HTML Foundations" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button")[2]);
    expect(screen.getByRole("heading", { name: "JavaScript Power" })).toBeInTheDocument();
    expect(screen.getByText("DOM Manipulation")).toBeInTheDocument();
  });
});
