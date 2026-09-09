import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import api from "../../api/axiosInstance";
import ChallengeDetailModal from "./ChallengeDetailModal";
import ChallengeEditModal from "./ChallengeEditModal";

jest.mock("../../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("recharts", () => {
  const MockChart = ({ children }) => <svg data-testid="mock-chart">{children}</svg>;
  const MockPart = ({ children }) => <g>{children}</g>;

  return {
    Area: MockPart,
    AreaChart: MockChart,
    Bar: MockPart,
    BarChart: MockChart,
    Cell: MockPart,
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

const challengeInsight = {
  challenge: {
    id: 7,
    module_name: "HTML",
    title: "Semantic HTML",
    difficulty: "EASY",
    challenge_type: "CHALLENGE",
    xp_points: 25,
    is_active: true,
    assignment_mode: "IGNITE",
    target_super_batches: ["Super Batch 47"],
    target_batches: ["A"],
    target_sub_batches: ["A1"],
    description: "Build a semantic HTML page.",
    start_time: "2099-05-14T10:00:00.000Z",
    end_time: "2099-05-14T12:00:00.000Z",
  },
  summary: {
    total_assigned_users: 20,
    completed_users: 12,
    incomplete_users: 8,
    submitted_once_users: 14,
    not_submitted_users: 6,
    average_score: 82,
    average_xp_earned: 18,
    completion_percentage: 60,
    submission_counts: 16,
    pass_percentage: 75,
    active_participation_rate: 70,
    pass_count: 12,
    fail_count: 4,
  },
  filters: {
    super_batches: ["47", "48"],
    batches: ["A", "B"],
  },
  charts: {
    submission_trends: [{ date: "2099-05-14", submissions: 16, passed: 12 }],
    engagement_trend: [{ date: "2099-05-14", activeLearners: 14 }],
    pass_fail_ratio: [
      { name: "Pass", value: 12 },
      { name: "Fail", value: 4 },
    ],
    xp_distribution: [{ range: "0-25", users: 12 }],
    difficulty_impact: [{ difficulty: "Easy", averageScore: 82, completion: 60 }],
  },
  top_performers: [
    {
      email: "usera2@tcs.com",
      employee_id: "usera2",
      user: "Learner A",
      batch: "A",
      best_score: 95,
      earned_xp: 25,
    },
  ],
  batch_analytics: [
    {
      batch: "A",
      completion_percentage: 60,
      assigned_users: 20,
      completed_users: 12,
      average_score: 82,
      participation_percentage: 70,
      active_learners: 14,
      submission_count: 16,
      submission_trends: [{ date: "2099-05-14", submissions: 16, passed: 12 }],
    },
  ],
  recent_activity: [
    {
      id: 1,
      user: "Learner A",
      status: "passed",
      score: 95,
      submitted_at: "2099-05-14T11:00:00.000Z",
    },
  ],
};

const editableChallenge = {
  id: 7,
  title: "Semantic HTML",
  description: "Build a semantic HTML page.",
  difficulty: "EASY",
  challenge_type: "CHALLENGE",
  module: 1,
  xp_points: 25,
  is_active: true,
  chatbot_enabled: false,
  assignment_mode: "IGNITE",
  target_super_batches: ["Super Batch 47"],
  target_batches: ["A"],
  target_sub_batches: ["A1"],
  employee_assignments: [],
  start_time: "2099-05-14T10:00:00.000Z",
  end_time: "2099-05-14T12:00:00.000Z",
  test_cases: [
    {
      input_data: JSON.stringify({
        type: "hasText",
        selector: "h1",
        expected: "Hello",
        message: "Heading exists",
      }),
      expected_output: "Heading exists",
    },
  ],
};

describe("admin challenge modals", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    api.get.mockReset();
    api.patch.mockReset();
    toast.error.mockClear();
    toast.success.mockClear();
    document.body.className = "";
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("ChallengeDetailModal loads insights, filters analytics, downloads report, and closes", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const createObjectURL = jest.fn(() => "blob:challenge");
    const revokeObjectURL = jest.fn();
    Object.defineProperty(window.URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(window.URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    api.get.mockImplementation((url) => {
      if (url.includes("export")) return Promise.resolve({ data: new Blob(["report"]) });
      return Promise.resolve({ data: challengeInsight });
    });

    render(<ChallengeDetailModal id={7} onClose={onClose} />);

    expect(await screen.findByRole("heading", { name: "Semantic HTML" })).toBeInTheDocument();
    expect(screen.getByText("Build a semantic HTML page.")).toBeInTheDocument();
    expect(screen.getAllByText("Assigned").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Learner A").length).toBeGreaterThan(0);
    expect(document.body).toHaveClass("challenge-modal-open");

    await user.selectOptions(screen.getByDisplayValue("All Super Batches"), "47");
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith("/challenges/7/insights/", { params: { super_batch: "47" } });
    });

    await user.click(screen.getByRole("button", { name: /download report/i }));
    expect(api.get).toHaveBeenCalledWith("/challenges/7/insights/export/", {
      params: { super_batch: "47" },
      responseType: "blob",
    });
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:challenge");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  test("ChallengeEditModal loads challenge, edits fields, adds test case, and saves payload", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const refresh = jest.fn();
    api.get.mockImplementation((url) => {
      if (url === "/modules/") return Promise.resolve({ data: [{ id: 1, name: "HTML" }] });
      return Promise.resolve({ data: editableChallenge });
    });
    api.patch.mockResolvedValue({});

    render(<ChallengeEditModal id={7} onClose={onClose} refresh={refresh} />);

    expect(await screen.findByRole("heading", { name: "Semantic HTML" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Updated Semantic HTML");
    await user.selectOptions(screen.getByLabelText("Difficulty"), "MEDIUM");
    await user.click(screen.getByRole("button", { name: /Add/i }));
    expect(screen.getByText("Test Case 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    const [endpoint, payload] = api.patch.mock.calls[0];
    expect(endpoint).toBe("/challenges/7/");
    expect(payload).toMatchObject({
      title: "Updated Semantic HTML",
      difficulty: "MEDIUM",
      challenge_type: "CHALLENGE",
      module: 1,
      xp_points: 25,
      target_super_batches: ["47"],
      target_batches: ["A"],
      target_sub_batches: ["A1"],
    });
    expect(payload.test_cases).toHaveLength(2);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("ChallengeEditModal switches to Non-Ignite employee assignment", async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url === "/modules/") return Promise.resolve({ data: [{ id: 1, name: "HTML" }] });
      return Promise.resolve({ data: editableChallenge });
    });
    api.patch.mockResolvedValue({});

    render(<ChallengeEditModal id={7} onClose={jest.fn()} refresh={jest.fn()} />);

    await screen.findByRole("heading", { name: "Semantic HTML" });
    await user.click(screen.getByLabelText("NON-IGNITE"));
    const employeeIdsGroup = screen.getByText("Employee IDs").closest(".access-group");
    fireEvent.change(within(employeeIdsGroup).getByRole("textbox"), { target: { value: "12345, 67890" } });
    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    expect(api.patch.mock.calls[0][1]).toMatchObject({
      assignment_mode: "NON_IGNITE",
      employee_ids: ["12345", "67890"],
    });
  });

  test("ChallengeEditModal closes and reports load failures", async () => {
    const onClose = jest.fn();
    api.get.mockRejectedValue({ response: { data: { detail: "Missing challenge" } } });

    render(<ChallengeEditModal id={404} onClose={onClose} refresh={jest.fn()} />);

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(toast.error).toHaveBeenCalledWith("Missing challenge", expect.any(Object));
  });

  test("ChallengeEditModal reports formatted save validation errors", async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url === "/modules/") return Promise.resolve({ data: [{ id: 1, name: "HTML" }] });
      return Promise.resolve({ data: editableChallenge });
    });
    api.patch.mockRejectedValue({
      response: {
        data: {
          title: ["This field may not be blank."],
          xp_points: "Enter a positive number.",
        },
      },
    });

    render(<ChallengeEditModal id={7} onClose={jest.fn()} refresh={jest.fn()} />);

    await screen.findByRole("heading", { name: "Semantic HTML" });
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Title: This field may not be blank.",
        expect.any(Object),
      );
    });
  });
});
