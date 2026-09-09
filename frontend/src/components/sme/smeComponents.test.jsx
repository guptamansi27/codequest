import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import api from "../../api/axiosInstance";
import SMEDashboardHome from "./SMEDashboardHome";
import SMEReports from "./SMEReports";

jest.mock("../../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("react-apexcharts", () => ({
  __esModule: true,
  default: ({ type, height, series }) => (
    <div data-testid="apex-chart" data-type={type} data-height={height}>
      {Array.isArray(series) ? `${series.length} series` : "chart"}
    </div>
  ),
}));

jest.mock("../../hooks/useDashChartHeight", () => ({
  useDashChartHeight: () => 240,
}));

jest.mock("recharts", () => {
  const MockChart = ({ children }) => <svg data-testid="mock-chart">{children}</svg>;
  const MockPart = ({ children }) => <g>{children}</g>;

  return {
    Area: MockPart,
    AreaChart: MockChart,
    Bar: MockPart,
    BarChart: MockChart,
    CartesianGrid: MockPart,
    Cell: MockPart,
    Pie: MockPart,
    PieChart: MockChart,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    Tooltip: MockPart,
    XAxis: MockPart,
    YAxis: MockPart,
  };
});

const smeDashboard = {
  sme: { name: "SME", email: "sme@tcs.com", role: "SME" },
  super_batches: ["1", "2"],
  batch_options: ["A", "B"],
  kpis: {
    created_challenges: 8,
    active_challenges: 5,
    assigned_learners: 120,
    submissions_count: 64,
    success_rate: 75,
    average_score: 81,
    top_performing_challenge: {
      title: "Responsive Cards",
      technology: "CSS",
      difficulty: "Medium",
      completionRate: 88,
      submissions: 32,
    },
  },
  charts: {
    submission_trends: [
      { date: "2026-05-13", submissions: 10, completed: 7 },
      { date: "2026-05-14", submissions: 12, completed: 9 },
    ],
    difficulty_analytics: [
      { difficulty: "EASY", successRate: 90 },
      { difficulty: "MEDIUM", successRate: 70 },
    ],
    completion_mix: [
      { name: "Passed", value: 40 },
      { name: "Pending", value: 24 },
    ],
    technology_analytics: [
      { technology: "HTML", completionRate: 80 },
      { technology: "React", completionRate: 62 },
    ],
    activity_heatmap: [
      { day: "2026-05-13", activity: 5 },
      { day: "2026-05-14", activity: 7 },
    ],
    overview: {
      content_portfolio: [
        { type: "Challenge", count: 6 },
        { type: "Assessment", count: 2 },
      ],
      attempt_mix: [
        { name: "First Try", value: 35 },
        { name: "Retry", value: 15 },
      ],
    },
  },
  recent_activity: [
    {
      id: 1,
      user: "Learner A",
      action: "completed",
      target: "Responsive Cards",
      time: "2026-05-14T00:00:00.000Z",
    },
    {
      id: 2,
      user: "Learner B",
      action: "started",
      target: "React State",
      time: null,
    },
  ],
};

const smeReports = {
  ...smeDashboard,
  kpis: {
    assigned_learners: 120,
    submissions_count: 64,
  },
  charts: {
    ...smeDashboard.charts,
    challenge_analytics: [
      {
        id: 10,
        title: "Responsive Cards",
        technology: "CSS",
        difficulty: "Medium",
        assigned: 40,
        completed: 32,
        completionRate: 80,
        averageScore: 86,
        passCount: 28,
        failCount: 4,
      },
      {
        id: 11,
        title: "React State",
        technology: "React",
        difficulty: "Hard",
        assigned: 30,
        completed: 12,
        completionRate: 40,
        averageScore: 68,
        passCount: 9,
        failCount: 3,
      },
    ],
  },
};

describe("SME side components", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("email", "sme@tcs.com");
    api.get.mockReset();
    toast.error.mockClear();
    toast.success.mockClear();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("SMEDashboardHome loads KPI cards, welcome identity, charts, and spotlight challenge", async () => {
    api.get.mockResolvedValue({ data: smeDashboard });

    render(<SMEDashboardHome />);

    expect(await screen.findByRole("heading", { name: "SME Dashboard" })).toBeInTheDocument();
    expect(screen.getByText(/Welcome Sme/i)).toBeInTheDocument();
    expect(screen.getByText("Created Challenges")).toBeInTheDocument();
    expect(screen.getByText("Assigned Learners")).toBeInTheDocument();
    expect(screen.getByText("Responsive Cards")).toBeInTheDocument();
    expect(screen.getAllByTestId("apex-chart").length).toBeGreaterThanOrEqual(2);
    expect(api.get).toHaveBeenCalledWith("/dashboard/sme/", { params: {} });
  });

  test("SMEDashboardHome changes super batch filter and resets selected batch", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: smeDashboard });

    render(<SMEDashboardHome />);

    await screen.findByRole("heading", { name: "SME Dashboard" });
    await user.selectOptions(screen.getByDisplayValue("All Super Batches"), "1");

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith("/dashboard/sme/", { params: { super_batch: "1" } });
    });
  });

  test("SMEDashboardHome displays analytics and activity tab content", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: smeDashboard });

    render(<SMEDashboardHome />);

    await screen.findByRole("heading", { name: "SME Dashboard" });

    await user.click(screen.getByRole("tab", { name: /analytics/i }));
    expect(screen.getByText("Submission pulse")).toBeInTheDocument();
    expect(screen.getByText("Pass rate by difficulty")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /activity/i }));
    expect(screen.getByText("Latest Activity")).toBeInTheDocument();
    expect(screen.getByText("Learner A")).toBeInTheDocument();
    expect(screen.getByText("React State")).toBeInTheDocument();
  });

  test("SMEDashboardHome deletes all activities only from the SME activity view", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: smeDashboard });

    render(<SMEDashboardHome />);

    await screen.findByRole("heading", { name: "SME Dashboard" });
    await user.click(screen.getByRole("tab", { name: /activity/i }));
    expect(screen.getByText("Learner A")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete all latest activities/i }));
    expect(screen.getByRole("dialog", { name: /delete activities/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.queryByText("Learner A")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Learner B")).not.toBeInTheDocument();
    expect(screen.getByText("No learner submissions yet")).toBeInTheDocument();
    expect(localStorage.getItem("codequest:dismissed-activities:sme-dashboard:sme@tcs.com")).toContain("1");
    expect(localStorage.getItem("codequest:dismissed-activities:sme-dashboard:sme@tcs.com")).toContain("2");
  });

  test("SMEReports loads report analytics table and filter controls", async () => {
    api.get.mockResolvedValue({ data: smeReports });

    render(<SMEReports />);

    expect(await screen.findByRole("heading", { name: "SME Reports" })).toBeInTheDocument();
    expect(screen.getByText("Submission and Completion Trends")).toBeInTheDocument();
    expect(screen.getByText("Challenge Analytics Table")).toBeInTheDocument();
    expect(screen.getByText("Responsive Cards")).toBeInTheDocument();
    expect(screen.getByText("React State")).toBeInTheDocument();
    expect(screen.getAllByTestId("responsive-container").length).toBeGreaterThanOrEqual(4);
  });

  test("SMEReports filters by super batch and batch", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: smeReports });

    render(<SMEReports />);

    await screen.findByRole("heading", { name: "SME Reports" });
    await user.selectOptions(screen.getByDisplayValue("All Super Batches"), "1");

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith("/dashboard/sme/", { params: { super_batch: "1" } });
    });

    await user.selectOptions(screen.getByDisplayValue("All Batches"), "A");

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith("/dashboard/sme/", {
        params: { super_batch: "1", batch: "A" },
      });
    });
  });

  test("SMEReports downloads complete SME report and individual challenge report", async () => {
    const user = userEvent.setup();
    const createObjectURL = jest.fn(() => "blob:sme-report");
    const revokeObjectURL = jest.fn();
    Object.defineProperty(window.URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(window.URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    api.get.mockImplementation((url) => {
      if (url.includes("export")) return Promise.resolve({ data: new Blob(["report"]) });
      return Promise.resolve({ data: smeReports });
    });

    render(<SMEReports />);

    await screen.findByRole("heading", { name: "SME Reports" });

    await user.click(screen.getByRole("button", { name: /^download reports$/i }));
    expect(api.get).toHaveBeenCalledWith("/reports/sme/export/", {
      params: {},
      responseType: "blob",
    });

    await user.click(screen.getAllByRole("button", { name: /^download$/i })[0]);
    expect(api.get).toHaveBeenCalledWith("/challenges/10/insights/export/", {
      params: {},
      responseType: "blob",
    });
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:sme-report");
  });

  test("SMEReports surfaces load failures without crashing the reports page", async () => {
    api.get.mockRejectedValue({ response: { data: { detail: "Report backend unavailable" } } });

    render(<SMEReports />);

    expect(await screen.findByRole("heading", { name: "SME Reports" })).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Report backend unavailable", expect.any(Object));
    expect(screen.getByText("Challenge Analytics Table")).toBeInTheDocument();
  });

  test("SMEReports shows errors when report downloads fail", async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url.includes("export")) {
        return Promise.reject({ response: { data: { detail: "Export failed" } } });
      }
      return Promise.resolve({ data: smeReports });
    });

    render(<SMEReports />);

    await screen.findByRole("heading", { name: "SME Reports" });

    await user.click(screen.getByRole("button", { name: /^download reports$/i }));
    expect(toast.error).toHaveBeenCalledWith("Export failed", expect.any(Object));

    await user.click(screen.getAllByRole("button", { name: /^download$/i })[0]);
    expect(toast.error).toHaveBeenCalledWith("Export failed", expect.any(Object));
  });
});
