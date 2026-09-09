import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import api from "../../api/axiosInstance";
import aiService from "../../services/aiService";
import Challenges from "./Challenges";
import Dashboard from "./Dashboard";
import UserManagement from "./UserManagement";

jest.mock("../../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock("../../services/aiService", () => ({
  __esModule: true,
  default: {
    generateTestCases: jest.fn(),
  },
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    info: jest.fn(),
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

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };

const adminDashboard = {
  admin: { name: "Admin", email: "admin@tcs.com", role: "ADMIN" },
  super_batches: ["47", "48"],
  batch_options: ["A", "B"],
  kpis: {
    total_users: 200,
    active_users: 150,
    completion_rate: 76,
    average_xp: 430,
    ai_usage: 88,
    completed_submissions: 120,
    in_progress: 30,
    total_submissions: 150,
  },
  charts: {
    user_growth: [{ month: "May", users: 20 }],
    task_completion: [{ tech: "HTML", completed: 50 }],
    ai_usage: [{ week: "W1", usage: 22 }],
    overview: {
      role_mix: [
        { label: "Learners", count: 170 },
        { label: "SME", count: 20 },
      ],
      submission_outcomes: [
        { name: "Passed", value: 120 },
        { name: "Pending", value: 30 },
      ],
      challenge_type_submissions: [{ type: "Challenge", submissions: 80 }],
    },
  },
  recent_activity: [
    {
      id: 1,
      user: "Learner A",
      action: "completed",
      target: "HTML Basics",
      type: "complete",
      time: "2026-05-14T00:00:00.000Z",
    },
  ],
};

const users = [
  {
    id: 1,
    email: "usera2@tcs.com",
    role: "USER",
    superBatch: "Super Batch 47",
    batch: "Batch A",
    subBatch: "A1",
    is_active: true,
  },
  {
    id: 2,
    email: "sme@tcs.com",
    role: "SME",
    superBatch: "Super Batch 48",
    batch: "Batch B",
    subBatch: "B2",
    is_active: false,
  },
];

const modules = [
  { id: 1, name: "HTML" },
  { id: 2, name: "CSS" },
  { id: 3, name: "JS" },
  { id: 4, name: "REACT" },
];

describe("remaining admin and SME management parts", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("email", "admin@tcs.com");
    localStorage.setItem("role", "admin");
    api.get.mockReset();
    api.patch.mockReset();
    api.post.mockReset();
    aiService.generateTestCases.mockReset();
  });

  test("Dashboard loads admin KPIs, filters, analytics tab, and activity tab", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: adminDashboard });

    render(<Dashboard />);

    expect(await screen.findByRole("heading", { name: "ADMIN Dashboard" })).toBeInTheDocument();
    expect(screen.getByText(/Welcome Admin/i)).toBeInTheDocument();
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("Task Completion Rate")).toBeInTheDocument();
    expect(screen.getAllByTestId("apex-chart").length).toBeGreaterThanOrEqual(2);

    await user.selectOptions(screen.getByDisplayValue("All Super Batches"), "47");
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith("/dashboard/admin/", { params: { program_type: "IGNITE", super_batch: "47" } });
    });

    await user.click(screen.getByRole("tab", { name: /analytics/i }));
    expect(screen.getByText("User growth")).toBeInTheDocument();
    expect(screen.getByText("AI usage trends")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /activity/i }));
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText("Learner A")).toBeInTheDocument();
  });

  test("Dashboard deletes all activities only from the admin activity view", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: adminDashboard });

    render(<Dashboard />);

    await screen.findByRole("heading", { name: "ADMIN Dashboard" });
    await user.click(screen.getByRole("tab", { name: /activity/i }));
    expect(screen.getByText("Learner A")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete all recent activities/i }));
    expect(screen.getByRole("dialog", { name: /delete activities/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.queryByText("Learner A")).not.toBeInTheDocument();
    });
    expect(screen.getByText("No recent activity yet")).toBeInTheDocument();
    expect(localStorage.getItem("codequest:dismissed-activities:admin-dashboard:admin@tcs.com")).toContain("1");
  });

  test("UserManagement loads users, filters/searches, toggles status, and edits user", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: users });
    api.patch.mockResolvedValue({});

    render(<UserManagement />);

    expect(await screen.findByRole("heading", { name: "User Management" })).toBeInTheDocument();
    expect(screen.getByText("2 total")).toBeInTheDocument();
    expect(screen.getByText("usera2")).toBeInTheDocument();
    expect(screen.getByText("sme")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filter by role"), "SME");
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    expect(screen.queryByText("usera2")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search users"));
    await user.type(screen.getByLabelText("Search users"), "sme");
    expect(screen.getByText("sme")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Activate" }));
    expect(api.patch).toHaveBeenCalledWith("/users/2/", { is_active: true });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("dialog", { name: "Edit user" })).toBeInTheDocument();
    expect(screen.getByLabelText("Employee ID")).toHaveValue("sme");

    await user.selectOptions(screen.getByLabelText("Role"), "ADMIN");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(api.patch).toHaveBeenLastCalledWith("/users/2/", {
      role: "ADMIN",
      program_type: null,
      employee_id: "",
      superBatch: null,
      batch: null,
      subBatch: null,
    });
  });

  test("UserManagement shows empty state when filters match no users", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: users });

    render(<UserManagement />);

    await screen.findByRole("heading", { name: "User Management" });
    await user.type(screen.getByLabelText("Search users"), "nobody");

    expect(screen.getByText("No users match this program or search.")).toBeInTheDocument();
  });

  test("Challenges validates empty form, generates AI test cases for SME, and publishes valid challenge", async () => {
    const user = userEvent.setup();
    localStorage.setItem("role", "sme");
    localStorage.setItem("program_type", "IGNITE");
    api.get.mockResolvedValue({ data: modules });
    api.post.mockResolvedValue({});
    aiService.generateTestCases.mockResolvedValue({
      success: true,
      testcases: [
        {
          type: "hasText",
          selector: "h1",
          expected: "Hello",
          message: "Heading text exists",
        },
      ],
    });
    const onSuccess = jest.fn();

    render(
      <MemoryRouter future={routerFuture}>
        <Challenges embedded onSuccess={onSuccess} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Create Challenges" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Challenges" })).toBeDisabled();

    await user.type(screen.getByLabelText("Title"), "HTML Heading");
    await user.type(screen.getByLabelText("Description"), "Build an HTML heading");
    await user.selectOptions(screen.getByLabelText("Type"), "Challenge");
    await user.selectOptions(screen.getByLabelText("Technology Stack"), "HTML");
    await user.selectOptions(screen.getByLabelText("Difficulty"), "Easy");
    await user.type(screen.getByLabelText("XP Points"), "20");

    await user.type(screen.getByLabelText(/Start Date & Time/i), "2099-05-14T10:00");
    await user.type(screen.getByLabelText(/End Date & Time/i), "2099-05-14T12:00");

    await user.click(screen.getByRole("button", { name: /^Super Batch$/i }));
    await user.click(screen.getByLabelText("47"));
    await user.click(document.body);
    await user.click(screen.getByRole("button", { name: /^Batch$/i }));
    await user.click(screen.getByLabelText("Batch A"));
    await user.click(document.body);
    await user.click(screen.getByRole("button", { name: /^Sub-batch$/i }));
    await user.click(screen.getByLabelText("A1"));
    await user.click(document.body);

    await user.click(screen.getByRole("button", { name: /Generate AI Testcases/i }));
    expect(aiService.generateTestCases).toHaveBeenCalledWith({
      title: "HTML Heading",
      description: "Build an HTML heading",
      technology: "HTML",
      difficulty: "Easy",
    });
    expect(await screen.findByDisplayValue("Heading text exists")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create Challenges" }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const [endpoint, body] = api.post.mock.calls[0];
    expect(endpoint).toBe("/challenges/");
    expect(body.challenges[0]).toMatchObject({
      title: "HTML Heading",
      difficulty: "EASY",
      challenge_type: "CHALLENGE",
      module: 1,
      xp_points: 20,
      target_super_batches: ["47"],
      target_batches: ["A"],
      target_sub_batches: ["A1"],
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test("Challenges supports Non-Ignite employee assignment and multiple challenge cards", async () => {
    const user = userEvent.setup();
    localStorage.setItem("role", "admin");
    api.get.mockResolvedValue({ data: modules });

    render(
      <MemoryRouter future={routerFuture}>
        <Challenges embedded />
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: "Create Challenges" });
    await user.click(screen.getByRole("button", { name: /Add Another Challenge/i }));
    expect(screen.getByText("Challenge 2")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Non-Ignite/i })[0]);
    await user.type(screen.getByPlaceholderText("EMP001, EMP002, EMP003"), "12345, 67890");
    await user.click(screen.getByRole("button", { name: /Add Employee IDs/i }));

    expect(screen.getByText(/12345/)).toBeInTheDocument();
    expect(screen.getByText(/67890/)).toBeInTheDocument();
  });
});
