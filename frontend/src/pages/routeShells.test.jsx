import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "./admin/AdminDashboard";
import SMEDashboard from "./sme/SMEDashboard";
import UserDashboard from "./user/UserDashboard";
import Galaxy from "./user/Galaxy";

jest.mock("../components/admin/AdminLayout", () => ({
  __esModule: true,
  default: () => {
    const { Outlet } = jest.requireActual("react-router-dom");
    return (
      <div>
        Admin layout
        <div data-testid="admin-outlet">
          <Outlet />
        </div>
      </div>
    );
  },
}));
jest.mock("../components/admin/Dashboard", () => ({ __esModule: true, default: () => <div>Admin home</div> }));
jest.mock("../components/admin/UserManagement", () => ({ __esModule: true, default: () => <div>User management</div> }));
jest.mock("../components/admin/Reports", () => ({ __esModule: true, default: () => <div>Admin reports</div> }));
jest.mock("../components/admin/ChallengeDashboard", () => ({
  __esModule: true,
  default: () => <div>Challenge dashboard</div>,
}));
jest.mock("../components/sme/SMEDashboardHome", () => ({ __esModule: true, default: () => <div>SME home</div> }));
jest.mock("../components/sme/SMEReports", () => ({ __esModule: true, default: () => <div>SME reports</div> }));
jest.mock("../components/user/UserLayout", () => ({
  __esModule: true,
  UserLayout: () => (
    <div>
      User layout
      <div data-testid="user-outlet" />
    </div>
  ),
}));
jest.mock("./user/Dashboard", () => ({ __esModule: true, default: () => <div>User dashboard page</div> }));
jest.mock("./user/Challenges", () => ({ __esModule: true, default: () => <div>User galaxy page</div> }));
jest.mock("./user/ChallengeDetail", () => ({ __esModule: true, default: () => <div>Challenge detail page</div> }));
jest.mock("./user/Test", () => ({ __esModule: true, default: () => <div>User test page</div> }));
jest.mock("./user/CodeOfTheDay", () => ({ __esModule: true, default: () => <div>Code of the day page</div> }));
jest.mock("./user/Leaderboard", () => ({ __esModule: true, default: () => <div>Leaderboard page</div> }));
jest.mock("./user/Reports", () => ({ __esModule: true, default: () => <div>User reports page</div> }));
jest.mock("../components/user/galaxy/GalaxyView", () => ({
  __esModule: true,
  default: ({ type }) => <div>Galaxy view {type}</div>,
}));

describe("dashboard route shells", () => {
  test("admin dashboard route shell renders nested routes", () => {
    render(
      <MemoryRouter initialEntries={["/reports"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AdminDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin layout")).toBeInTheDocument();
    expect(screen.getByText("Admin reports")).toBeInTheDocument();
  });

  test.each([
    ["/", "Admin home"],
    ["/users", "User management"],
    ["/challenges", "Challenge dashboard"],
    ["/viewChallenges", "Challenge dashboard"],
  ])("admin dashboard routes %s to the expected admin content", (entry, expectedText) => {
    render(
      <MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AdminDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  test("sme dashboard route shell renders layout", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SMEDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin layout")).toBeInTheDocument();
    expect(screen.getByText("SME home")).toBeInTheDocument();
  });

  test.each([
    ["/challenges", "Challenge dashboard"],
    ["/reports", "SME reports"],
  ])("sme dashboard routes %s to the expected SME content", (entry, expectedText) => {
    render(
      <MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SMEDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  test("sme dashboard redirects index and legacy create route", () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SMEDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText("SME home")).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={["/challenges/create"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SMEDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText("Challenge dashboard")).toBeInTheDocument();
  });

  test("user dashboard route shell renders standalone galaxy route", () => {
    render(
      <MemoryRouter initialEntries={["/galaxy"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <UserDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText("User galaxy page")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dashboard/i })).toBeInTheDocument();
  });

  test("user dashboard route shell labels specific galaxy return button", () => {
    render(
      <MemoryRouter initialEntries={["/galaxy/html"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <UserDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText("Galaxy view html")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Galaxies/i })).toBeInTheDocument();
  });

  test("galaxy page passes URL param to GalaxyView", () => {
    render(
      <MemoryRouter initialEntries={["/galaxy/react"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Galaxy />
      </MemoryRouter>,
    );

    expect(screen.getByText("Galaxy view html")).toBeInTheDocument();
  });
});
