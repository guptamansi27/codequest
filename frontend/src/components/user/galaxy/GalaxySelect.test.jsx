import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "react-toastify";
import GalaxySelect from "./GalaxySelect";
import { loadGalaxyData } from "./galaxyData";

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("@react-three/fiber", () => ({
  Canvas: ({ children }) => <div data-testid="mock-canvas">{children}</div>,
  useFrame: jest.fn(),
  useThree: jest.fn((selector) => selector({ viewport: { width: 18, height: 10 } })),
}));

jest.mock("@react-three/drei", () => ({
  Float: ({ children }) => <div data-testid="mock-float">{children}</div>,
  Html: ({ children }) => <div>{children}</div>,
  OrbitControls: () => <div data-testid="mock-orbit-controls" />,
  Stars: () => <div data-testid="mock-stars" />,
}));

jest.mock("./galaxyData", () => {
  const actual = jest.requireActual("./galaxyData");
  return {
    ...actual,
    loadGalaxyData: jest.fn(),
  };
});

const challengeRows = [
  { id: 1, challenge_type: "CHALLENGE", module_name: "HTML", is_active: true },
  { id: 2, challenge_type: "CHALLENGE", module_name: "CSS", is_active: true },
  { id: 3, challenge_type: "CHALLENGE", module_name: "JS", is_active: true },
  { id: 4, challenge_type: "CHALLENGE", module_name: "REACT", is_active: true },
];

const renderGalaxySelect = () =>
  render(
    <MemoryRouter initialEntries={["/user/galaxy"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/user/galaxy" element={<GalaxySelect />} />
        <Route path="/user/galaxy/:type" element={<h1>Galaxy route</h1>} />
      </Routes>
    </MemoryRouter>,
  );

const getGalaxyButton = (name) =>
  screen.getAllByRole("button").find((button) => button.querySelector("strong")?.textContent === name);

describe("GalaxySelect", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    loadGalaxyData.mockReset();
    toast.error.mockClear();
    toast.info.mockClear();
    document.body.style.cursor = "";
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("loads galaxy progress and opens unlocked galaxies", async () => {
    const user = userEvent.setup();
    loadGalaxyData.mockResolvedValue({
      challenges: challengeRows,
      submissions: [{ challenge: 1, is_passed: true }],
    });

    renderGalaxySelect();

    expect(screen.getByText("Loading galaxies...")).toBeInTheDocument();
    await waitFor(() => expect(getGalaxyButton("HTML Galaxy")).toBeInTheDocument());
    expect(getGalaxyButton("HTML Galaxy")).toHaveTextContent("100% progress");
    expect(getGalaxyButton("CSS Galaxy")).toHaveTextContent("0% progress");
    expect(getGalaxyButton("JavaScript Galaxy")).toHaveTextContent("Locked until CSS Galaxy");

    await user.click(getGalaxyButton("HTML Galaxy"));
    expect(screen.getByRole("heading", { name: "Galaxy route" })).toBeInTheDocument();
  });

  test("shows a toast for locked galaxies and reports load failures", async () => {
    const user = userEvent.setup();
    loadGalaxyData.mockResolvedValue({
      challenges: challengeRows,
      submissions: [],
    });

    const { unmount } = renderGalaxySelect();

    await waitFor(() => expect(getGalaxyButton("HTML Galaxy")).toBeInTheDocument());
    await user.click(getGalaxyButton("CSS Galaxy"));
    expect(toast.info).toHaveBeenCalledWith("CSS Galaxy unlocks after you complete HTML Galaxy.", {
      toastId: "locked-galaxy-css",
    });
    unmount();

    loadGalaxyData.mockRejectedValue({ response: { data: { detail: "Failed" } } });

    renderGalaxySelect();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed", expect.any(Object)));
  });
});
