import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "../../api/axiosInstance";
import Dashboard from "./Dashboard";
import Challenges from "./Challenges";
import CodeOfTheDay from "./CodeOfTheDay";
import Leaderboard from "./Leaderboard";
import Reports from "./Reports";
import Test from "./Test";
import UserDashboard from "./UserDashboard";
import ChallengeDetail from "./ChallengeDetail";
import { clearGalaxyDataCache } from "../../components/user/galaxy/galaxyData";

jest.mock("../../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
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

jest.mock("../../components/user/galaxy/GalaxySelect", () => ({
  __esModule: true,
  default: () => <div data-testid="galaxy-select">Galaxy selector</div>,
}));

const mockWorkspaceState = {
  activeLanguage: "html",
  activeSidePanel: "question",
  botMessages: [],
  code: { html: "<h1>Hello</h1>", css: "", js: "" },
  handleCodeChange: jest.fn(),
  handleWorkspaceFilesChange: jest.fn(),
  hasUnsavedChanges: false,
  loadWorkspace: jest.fn(),
  markCodeSaved: jest.fn(),
  questionCollapsed: false,
  setActiveLanguage: jest.fn(),
  setActiveSidePanel: jest.fn(),
  setBotMessages: jest.fn(),
  setQuestionCollapsed: jest.fn(),
};

jest.mock("../../components/user/workspace/useSharedChallengeEditorState", () => ({
  __esModule: true,
  default: () => mockWorkspaceState,
}));

jest.mock("../../components/user/workspace/SharedChallengeEditorLayout", () => ({
  __esModule: true,
  default: function MockSharedChallengeEditorLayout({ challenge, code, onExit, onRun, onSave, onSubmit, previewRef, runState }) {
    const { useEffect } = require("react");
    useEffect(() => {
      previewRef.current = {
        runVisibleTests: jest.fn().mockResolvedValue({ passed: 1, total: 1 }),
        runAllTests: jest.fn().mockResolvedValue({ status: "Accepted", passed: 1, total: 1 }),
      };
    }, [previewRef]);

    return (
      <section aria-label="workspace">
        <h1>{challenge.title}</h1>
        <pre>{code.html}</pre>
        <span>{runState}</span>
        <button type="button" onClick={onRun}>Run Tests</button>
        <button type="button" onClick={onSave}>Save Code</button>
        <button type="button" onClick={onSubmit}>Submit Code</button>
        <button type="button" onClick={onExit}>Exit Workspace</button>
      </section>
    );
  },
}));

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };

const dateAtLocalOffset = (offsetDays) => {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const activeChallenge = {
  id: 7,
  title: "Semantic HTML",
  description: "Build a semantic page",
  difficulty: "EASY",
  challenge_type: "CHALLENGE",
  module_name: "HTML",
  module: 1,
  xp_points: 25,
  is_active: true,
  start_time: "2026-01-01T00:00:00.000Z",
  end_time: "2099-01-01T00:00:00.000Z",
  starter_code: { html: "<h1>Hello</h1>", css: "", js: "" },
  test_cases: [],
};

const upcomingChallenge = {
  ...activeChallenge,
  id: 8,
  title: "Future CSS",
  module_name: "CSS",
  module: 2,
  start_time: "2099-01-01T00:00:00.000Z",
  end_time: "2099-01-02T00:00:00.000Z",
};

const expiredChallenge = {
  ...activeChallenge,
  id: 9,
  title: "Old JS",
  module_name: "JS",
  module: 3,
  start_time: "2020-01-01T00:00:00.000Z",
  end_time: "2020-01-02T00:00:00.000Z",
};

const activeAssessment = {
  ...activeChallenge,
  id: 17,
  title: "HTML Assessment",
  description: "Assessment description",
  challenge_type: "ASSESSMENT",
  module_name: "HTML",
};

const upcomingAssessment = {
  ...upcomingChallenge,
  id: 18,
  title: "Future Assessment",
  description: "Upcoming assessment",
  challenge_type: "ASSESSMENT",
};

const expiredAssessment = {
  ...expiredChallenge,
  id: 19,
  title: "Past Assessment",
  description: "Expired assessment",
  challenge_type: "ASSESSMENT",
};

const passedSubmission = {
  id: 1,
  challenge: 7,
  challenge_id: 7,
  is_passed: true,
  status: "Accepted",
  earned_xp: 25,
  created_at: new Date().toISOString(),
};

const dashboardResponse = {
  user: { name: "Learner", email: "learner@tcs.com" },
  stats: {
    completed_challenges: 5,
    accuracy: 86,
    in_progress: 2,
    rank: 4,
    total_xp: 250,
    code_of_day_streak: 3,
  },
  language_progress: [
    { name: "HTML", value: 80, color: "#06b6d4" },
    { name: "CSS", value: 60, color: "#3b82f6" },
  ],
  monthly_activity: [{ day: "Mon", activity: 2 }],
  performance: [{ module: "HTML", score: 92 }],
  overview: {
    week_activity: [{ label: "Mon", activity: 2 }],
    completed_by_module: [],
  },
};

const reportsResponse = {
  summary: {
    current_rank: 4,
    total_learners: 50,
    total_xp: 250,
    weekly_xp: 40,
    challenges_completed: 5,
    success_rate: 86,
    assessment_completion: 70,
    code_of_day_completed: 3,
  },
  module_progress: [{ name: "HTML", completed: 4, total: 5, percentage: 80 }],
  strengths: [{ skill: "Semantic HTML", level: "Advanced", percentage: 90 }],
  improvements: [{ skill: "CSS Grid", percentage: 45 }],
  recent_activity: [{ id: 1, title: "Completed Semantic HTML", points: "+25 XP", date: "2026-05-14T10:00:00.000Z" }],
};

const renderWithRouter = (ui, initialEntries = ["/user"]) =>
  render(
    <MemoryRouter future={routerFuture} initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>,
  );

describe("user pages", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem("email", "learner@tcs.com");
    api.get.mockReset();
    api.post.mockReset();
    api.put.mockReset();
    clearGalaxyDataCache();
    Object.values(mockWorkspaceState).forEach((value) => {
      if (jest.isMockFunction(value)) value.mockClear();
    });
  });

  test("Dashboard loads user KPIs and switches dashboard tabs", async () => {
    const user = userEvent.setup();
    const dailyToday = {
      ...activeChallenge,
      id: 31,
      title: "Today Daily",
      challenge_type: "CODE_OF_DAY",
      start_time: dateAtLocalOffset(0),
      end_time: dateAtLocalOffset(1),
    };
    const normalChallengeSubmission = { ...passedSubmission, challenge: activeChallenge.id, challenge_id: activeChallenge.id };
    const dailySubmission = { ...passedSubmission, id: 31, challenge: dailyToday.id, challenge_id: dailyToday.id };
    api.get.mockImplementation((url, config) => {
      if (url === "/dashboard/user/") return Promise.resolve({ data: dashboardResponse });
      if (url === "/submissions/") return Promise.resolve({ data: [normalChallengeSubmission, dailySubmission] });
      if (config?.params?.type === "code_of_the_day" && config?.params?.status === "active") {
        return Promise.resolve({ data: [dailyToday] });
      }
      if (config?.params?.type === "code_of_the_day") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderWithRouter(<Dashboard />);

    expect(await screen.findByRole("heading", { name: "USER Dashboard" })).toBeInTheDocument();
    expect(screen.getByText(/Welcome learner/i)).toBeInTheDocument();
    expect(screen.getByText("Completed Challenges")).toBeInTheDocument();
    expect(screen.getByText("86%")).toBeInTheDocument();
    expect(screen.getByText("3 Days")).toBeInTheDocument();
    expect(screen.getAllByTestId("apex-chart").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("tab", { name: /skills/i }));
    expect(screen.getByText("Average completion")).toBeInTheDocument();
    expect(screen.getByText("80% complete")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /momentum/i }));
    expect(screen.getByText("Monthly Activity")).toBeInTheDocument();
    expect(screen.getByText("Performance by Module")).toBeInTheDocument();
  });

  test("Challenges renders only the galaxy selector entry point", async () => {
    render(
      <MemoryRouter future={routerFuture} initialEntries={["/user/galaxy"]}>
        <Routes>
          <Route path="/user/galaxy" element={<Challenges />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("galaxy-select")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Challenge Schedule" })).not.toBeInTheDocument();
    expect(screen.queryByText("Semantic HTML")).not.toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  test("CodeOfTheDay renders heatmap, active card, and scheduled tabs", async () => {
    const user = userEvent.setup();
    const dailyActive = {
      ...activeChallenge,
      id: 11,
      title: "Daily HTML",
      challenge_type: "CODE_OF_DAY",
      start_time: startOfToday(),
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    const dailyUpcoming = { ...upcomingChallenge, id: 12, title: "Tomorrow CSS", challenge_type: "CODE_OF_DAY" };
    const dailyExpired = { ...expiredChallenge, id: 13, title: "Yesterday JS", challenge_type: "CODE_OF_DAY" };
    const dailySubmission = { ...passedSubmission, id: 11, challenge: 11, challenge_id: 11 };
    api.get.mockImplementation((url, config) => {
      if (url === "/dashboard/user/") return Promise.resolve({ data: { stats: { code_of_day_streak: 1 } } });
      if (url === "/submissions/") return Promise.resolve({ data: [passedSubmission, dailySubmission] });
      if (config?.params?.status === "active") return Promise.resolve({ data: [dailyActive] });
      if (config?.params?.status === "upcoming") return Promise.resolve({ data: [dailyUpcoming] });
      if (config?.params?.status === "expired") return Promise.resolve({ data: [dailyExpired] });
      return Promise.resolve({ data: [] });
    });

    renderWithRouter(<CodeOfTheDay />);

    expect(await screen.findByRole("heading", { name: "Code of the Day" })).toBeInTheDocument();
    expect(screen.getByLabelText("Daily coding activity graph")).toBeInTheDocument();
    expect(screen.getByText("1 Days")).toBeInTheDocument();
    expect(screen.getByText("Daily HTML")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Upcoming/i }));
    expect(screen.getByText("Tomorrow CSS")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Expired/i }));
    expect(screen.getByText("Yesterday JS")).toBeInTheDocument();
  });

  test("Leaderboard renders podium, top ten, and current user rank band", async () => {
    api.get.mockResolvedValue({
      data: [
        { email: "first@tcs.com", rank: 1, xp: 900, completed_challenges: 9, submissions: 12 },
        { email: "second@tcs.com", rank: 2, xp: 800, completed_challenges: 8, submissions: 11 },
        { email: "third@tcs.com", rank: 3, xp: 700, completed_challenges: 7, submissions: 10 },
        { email: "fourth@tcs.com", rank: 4, xp: 600 },
        { email: "fifth@tcs.com", rank: 5, xp: 500 },
        { email: "sixth@tcs.com", rank: 6, xp: 400 },
        { email: "seventh@tcs.com", rank: 7, xp: 300 },
        { email: "eighth@tcs.com", rank: 8, xp: 200 },
        { email: "ninth@tcs.com", rank: 9, xp: 100 },
        { email: "tenth@tcs.com", rank: 10, xp: 90 },
        { email: "learner@tcs.com", rank: 14, xp: 70, completed_challenges: 5, submissions: 6, is_current_user: true },
      ],
    });

    renderWithRouter(<Leaderboard />);

    expect(await screen.findByRole("heading", { name: "Leaderboard" })).toBeInTheDocument();
    expect(screen.getByText("Top Performer")).toBeInTheDocument();
    expect(screen.getByText("Top 10 rankings")).toBeInTheDocument();
    expect(screen.getByText("Your position")).toBeInTheDocument();
    expect(screen.getByText(/Learner \(You\)/)).toBeInTheDocument();
  });

  test("Reports loads summary, module progress, strengths, improvements, and recent activity", async () => {
    api.get.mockResolvedValue({ data: reportsResponse });

    renderWithRouter(<Reports />);

    expect(await screen.findByRole("heading", { name: "Reports" })).toBeInTheDocument();
    expect(screen.getByText("Current Rank")).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();
    expect(screen.getByText("HTML")).toBeInTheDocument();
    expect(screen.getByText("Semantic HTML")).toBeInTheDocument();
    expect(screen.getByText("CSS Grid")).toBeInTheDocument();
    expect(screen.getByText("Completed Semantic HTML")).toBeInTheDocument();
  });

  test("Reports deletes all activities from the current learner view after confirmation", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: reportsResponse });

    renderWithRouter(<Reports />);

    expect(await screen.findByText("Completed Semantic HTML")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /delete all recent activities/i }));
    expect(screen.getByRole("dialog", { name: /delete activities/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.queryByText("Completed Semantic HTML")).not.toBeInTheDocument();
    });
    expect(localStorage.getItem("codequest:dismissed-activities:user-reports:learner@tcs.com")).toContain("1");
  });

  test("Test page groups assessments and opens live assessment with popup fallback", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "open").mockReturnValue(null);
    api.get.mockImplementation((url, config) => {
      if (url === "/submissions/") return Promise.resolve({ data: [] });
      if (config?.params?.status === "active") return Promise.resolve({ data: [activeAssessment] });
      if (config?.params?.status === "upcoming") return Promise.resolve({ data: [upcomingAssessment] });
      if (config?.params?.status === "expired") return Promise.resolve({ data: [expiredAssessment] });
      if (url === "/challenges/17/") return Promise.resolve({ data: activeAssessment });
      if (url === "/drafts/17/") return Promise.resolve({ data: { code: null } });
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter future={routerFuture} initialEntries={["/user/test"]}>
        <Routes>
          <Route path="/user/test" element={<Test />} />
          <Route path="/user/test/:assessmentId" element={<Test />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Assessments" })).toBeInTheDocument();
    expect(screen.getByText("HTML Assessment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Active 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Expired 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upcoming 1/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Upcoming/i }));
    expect(screen.getByText("Future Assessment")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Expired/i }));
    expect(screen.getByText("Past Assessment")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Active/i }));
    await user.click(screen.getByRole("button", { name: /Start Assessment/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Start Now/i }));
    expect(window.open).toHaveBeenCalledWith("/user/test/17", "_blank", "popup=yes,width=1440,height=900");
    expect(await screen.findByRole("heading", { name: "HTML Assessment" })).toBeInTheDocument();
    expect(mockWorkspaceState.loadWorkspace).toHaveBeenCalled();
  });

  test("Test page renders empty state and direct assessment workspace route", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "close").mockImplementation(() => {});
    api.get.mockImplementation((url) => {
      if (url === "/challenges/17/") return Promise.resolve({ data: activeAssessment });
      if (url === "/drafts/17/") return Promise.resolve({ data: { code: JSON.stringify({ html: "<h1>Assessment draft</h1>" }) } });
      if (url === "/submissions/") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    const { unmount } = renderWithRouter(<Test />, ["/user/test"]);

    expect(await screen.findByRole("heading", { name: "Assessments" })).toBeInTheDocument();
    expect(screen.getByText("No assessments available")).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter future={routerFuture} initialEntries={["/user/test/17"]}>
        <Routes>
          <Route path="/user/test/:assessmentId" element={<Test />} />
          <Route path="/user/test" element={<div>Assessment list route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "HTML Assessment" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Exit Workspace" }));
    await user.click(screen.getByRole("button", { name: "Exit" }));
    expect(await screen.findByText("Assessment list route")).toBeInTheDocument();
  });

  test("ChallengeDetail loads workspace, saves, runs, submits, and exits", async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url === "/challenges/7/") return Promise.resolve({ data: activeChallenge });
      if (url === "/challenges/?type=challenge") return Promise.resolve({ data: [activeChallenge] });
      if (url === "/submissions/") return Promise.resolve({ data: [] });
      if (url === "/drafts/7/") return Promise.resolve({ data: { code: JSON.stringify({ html: "<h1>Draft</h1>" }) } });
      return Promise.resolve({ data: [] });
    });
    api.put.mockResolvedValue({});
    api.post.mockResolvedValue({ data: { submissionSuccess: true, challengeCompleted: true, earned_xp: 25 } });

    render(
      <MemoryRouter future={routerFuture} initialEntries={["/user/challenge/7"]}>
        <Routes>
          <Route path="/user/challenge/:id" element={<ChallengeDetail />} />
          <Route path="/user/galaxy/:type" element={<div>Galaxy return</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Semantic HTML" })).toBeInTheDocument();
    expect(mockWorkspaceState.loadWorkspace).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Save Code" }));
    expect(api.put).toHaveBeenCalledWith("/drafts/7/", { code: JSON.stringify(mockWorkspaceState.code) });

    await user.click(screen.getByRole("button", { name: "Run Tests" }));
    await waitFor(() => expect(screen.getByText("complete")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Submit Code" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/submissions/",
      expect.objectContaining({ challenge: 7, is_passed: true }),
    ));

    await user.click(screen.getByRole("button", { name: "Exit Workspace" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Are you sure you want to exit?");
    await user.click(screen.getByRole("button", { name: "Save & Exit" }));
    expect(await screen.findByText("Galaxy return")).toBeInTheDocument();
  });

  test("UserDashboard route shell renders nested user routes and standalone return button", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/reports/user/") return Promise.resolve({ data: reportsResponse });
      if (url === "/challenges/") return Promise.resolve({ data: [] });
      if (url === "/submissions/") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: dashboardResponse });
    });

    renderWithRouter(<UserDashboard />, ["/reports"]);
    expect(await screen.findByRole("heading", { name: "Reports" })).toBeInTheDocument();
  });
});
