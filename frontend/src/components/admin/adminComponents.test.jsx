import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import api from "../../api/axiosInstance";
import AdminLayout from "./AdminLayout";
import AdminProfile from "./AdminProfile";
import ChallengeDashboard from "./ChallengeDashboard";
import ChallengeScheduleFields from "./ChallengeScheduleFields";
import Reports from "./Reports";

jest.mock("../../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("motion/react", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  useReducedMotion: () => true,
}));

jest.mock("recharts", () => {
  const MockChart = ({ children }) => <svg data-testid="mock-chart">{children}</svg>;
  const MockPart = ({ children }) => <div>{children}</div>;

  return {
    Area: MockPart,
    AreaChart: MockChart,
    Bar: MockPart,
    BarChart: MockChart,
    CartesianGrid: MockPart,
    Cell: MockPart,
    Legend: MockPart,
    Line: MockPart,
    LineChart: MockChart,
    Pie: MockPart,
    PieChart: MockChart,
    RadialBar: MockPart,
    RadialBarChart: MockChart,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    Tooltip: MockPart,
    XAxis: MockPart,
    YAxis: MockPart,
  };
});

jest.mock("./ChallengeDetailModal", () => ({
  __esModule: true,
  default: ({ id, onClose }) => (
    <div role="dialog" aria-label="challenge detail">
      Detail {id}
      <button type="button" onClick={onClose}>
        Close detail
      </button>
    </div>
  ),
}));

jest.mock("./ChallengeEditModal", () => ({
  __esModule: true,
  default: ({ id, onClose }) => (
    <div role="dialog" aria-label="challenge edit">
      Edit {id}
      <button type="button" onClick={onClose}>
        Close edit
      </button>
    </div>
  ),
}));

jest.mock("./Challenges", () => ({
  __esModule: true,
  default: ({ embedded, initialClone, onSuccess }) => (
    <div>
      {embedded ? "Embedded challenge form" : "Challenge form"}
      {initialClone ? <span>Clone: {initialClone.title}</span> : null}
      <button type="button" onClick={onSuccess}>
        Create Challenges
      </button>
    </div>
  ),
}));

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };

const adminReports = {
  super_batches: ["1"],
  batch_options: ["A"],
  batches: [{ batch: "Batch A", value: "A", completion: 80, avgScore: 72, users: 20 }],
  kpis: {
    total_users: 120,
    active_users: 100,
    completed_challenges: 45,
    submissions_count: 200,
    challenge_completion_rate: 75,
    average_scores: 70,
    assessment_average_score: 82,
    assessment_completion_rate: 60,
  },
  charts: {
    batch_performance: [{ week: "W1", score: 70, completionRate: 60 }],
    submissions_over_time: [{ date: "2026-05-14", submissions: 5, completed: 3 }],
    active_users: [{ date: "2026-05-14", activeUsers: 30 }],
    difficulty_analytics: [{ difficulty: "Easy", successRate: 90 }],
    module_performance: [{ module: "HTML", completion: 80 }],
    activity_heatmap: [],
  },
  leaderboard: [
    { rank: 1, email: "usera2@tcs.com", batch: "A", xpPoints: 500, challengesCompleted: 12 },
    { rank: 4, email: "userb@tcs.com", batch: "A", xpPoints: 250, challengesCompleted: 6 },
  ],
  recent_activity: [],
};

const challengeRows = [
  {
    id: 1,
    title: "HTML Basics",
    module_name: "HTML",
    challenge_type: "challenge",
    xp_points: 25,
    difficulty: "Easy",
    is_active: true,
    chatbot_enabled: false,
    start_time: "2026-05-14T00:00:00.000Z",
    end_time: "2099-05-14T00:00:00.000Z",
  },
  {
    id: 2,
    title: "Expired CSS",
    module_name: "CSS",
    challenge_type: "assessment",
    xp_points: 50,
    difficulty: "Medium",
    is_active: true,
    chatbot_enabled: true,
    start_time: "2020-05-14T00:00:00.000Z",
    end_time: "2021-05-14T00:00:00.000Z",
  },
];

describe("admin side components", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("role", "admin");
    localStorage.setItem("email", "admin@tcs.com");
    api.get.mockReset();
    api.patch.mockReset();
    api.delete.mockReset();
  });

  test("AdminLayout renders admin navigation and logs out cleanly", async () => {
    const user = userEvent.setup();
    localStorage.setItem("access", "access-token");
    localStorage.setItem("refresh", "refresh-token");

    render(
      <MemoryRouter initialEntries={["/admin/users"]} future={routerFuture}>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route path="users" element={<div>User management outlet</div>} />
          </Route>
          <Route path="/login" element={<div>Login route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Dashboard")).toBeInTheDocument();
    expect(screen.getByLabelText("User Management")).toHaveClass("active");
    expect(screen.getByText("User management outlet")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Logout"));

    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
    expect(screen.getByText("Login route")).toBeInTheDocument();
  });

  test("AdminLayout switches navigation for SME role", () => {
    localStorage.setItem("role", "sme");

    render(
      <MemoryRouter initialEntries={["/sme/dashboard"]} future={routerFuture}>
        <Routes>
          <Route path="/sme/*" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>SME outlet</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Manage Challenges")).toBeInTheDocument();
    expect(screen.queryByLabelText("User Management")).not.toBeInTheDocument();
    expect(screen.getByText("SME outlet")).toBeInTheDocument();
  });

  test("AdminProfile displays identity, stats, activity, and settings tabs", async () => {
    const user = userEvent.setup();

    render(<AdminProfile />);

    expect(screen.getByRole("heading", { name: "admin@tcs.com" })).toBeInTheDocument();
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("Personal Information")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Activity" }));
    expect(screen.getByText("Created new challenge")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByText("Email Notifications")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  test("ChallengeScheduleFields renders values, errors, locks, and change callbacks", async () => {
    const user = userEvent.setup();
    const onStartChange = jest.fn();
    const onEndChange = jest.fn();

    render(
      <ChallengeScheduleFields
        start="2026-05-14T10:00"
        end="2026-05-14T12:00"
        onStartChange={onStartChange}
        onEndChange={onEndChange}
        errors={{ end: "End date and time must be after start date and time." }}
        startLocked
      />,
    );

    const startInput = screen.getByLabelText(/Start Date & Time/i);
    const endInput = screen.getByLabelText(/End Date & Time/i);

    expect(startInput).toBeDisabled();
    expect(screen.getByText(/14 May 2026/i)).toBeInTheDocument();
    expect(screen.getByText("End date and time must be after start date and time.")).toBeInTheDocument();

    await user.clear(endInput);
    await user.type(endInput, "2026-05-14T13:30");
    expect(onEndChange).toHaveBeenCalled();
    expect(onStartChange).not.toHaveBeenCalled();
  });

  test("ChallengeDashboard loads, filters, opens view modal, toggles and deletes as admin", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: challengeRows });
    api.patch.mockResolvedValue({ data: { is_active: false, chatbot_enabled: true } });
    api.delete.mockResolvedValue({});

    render(<ChallengeDashboard />);

    expect(await screen.findByText("HTML Basics")).toBeInTheDocument();
    expect(screen.getByText("Expired CSS")).toBeInTheDocument();

    await user.selectOptions(screen.getAllByRole("combobox")[0], "Expired");
    expect(screen.queryByText("HTML Basics")).not.toBeInTheDocument();
    expect(screen.getByText("Expired CSS")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(screen.getByText("HTML Basics")).toBeInTheDocument();

    await user.click(screen.getAllByTitle("View challenge")[0]);
    expect(screen.getByRole("dialog", { name: "challenge detail" })).toHaveTextContent("Detail 1");

    await user.click(screen.getAllByRole("button", { name: /deactivate/i })[0]);
    expect(api.patch).toHaveBeenCalledWith("/challenges/1/toggle/", { is_active: false });

    await user.click(screen.getAllByTitle("Delete challenge")[0]);
    expect(api.delete).toHaveBeenCalledWith("/challenges/1/");
  });

  test("ChallengeDashboard exposes SME create, edit, and clone flows", async () => {
    const user = userEvent.setup();
    localStorage.setItem("role", "sme");
    api.get.mockImplementation((url) => {
      if (url === "/challenges/1/") return Promise.resolve({ data: { id: 1, title: "HTML Basics Clone" } });
      return Promise.resolve({ data: challengeRows });
    });

    render(<ChallengeDashboard />);

    expect(await screen.findByRole("heading", { name: "Manage Challenges" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /create challenge/i }));
    expect(screen.getByRole("dialog", { name: /embedded challenge form/i })).toBeInTheDocument();

    await user.click(screen.getByLabelText("Close create challenge modal"));
    await user.click(screen.getAllByTitle("Edit challenge")[0]);
    expect(screen.getByRole("dialog", { name: "challenge edit" })).toHaveTextContent("Edit 1");

    await user.click(screen.getAllByTitle("Clone challenge")[0]);
    expect(await screen.findByText("Clone: HTML Basics Clone")).toBeInTheDocument();
  });

  test("Reports loads admin analytics, filters, and downloads CSV", async () => {
    const user = userEvent.setup();
    const createObjectURL = jest.fn(() => "blob:report");
    const revokeObjectURL = jest.fn();
    Object.defineProperty(window.URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(window.URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    api.get.mockResolvedValue({ data: adminReports });

    render(<Reports />);

    expect(await screen.findByRole("heading", { name: "Reports" })).toBeInTheDocument();
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("usera2@tcs.com")).toBeInTheDocument();

    await user.selectOptions(screen.getByDisplayValue("All Super Batches"), "1");
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith("/reports/admin/", { params: { program_type: "IGNITE", super_batch: "1" } });
    });

    await user.click(screen.getByRole("button", { name: /download reports/i }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:report");
  });
});
