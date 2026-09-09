import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import App from "./App";

jest.mock("react-toastify", () => ({
  ToastContainer: (props) => <div data-testid="toast-container" data-theme={props.theme} />,
}));

jest.mock("./pages/public/LandingPage", () => ({
  __esModule: true,
  default: ({ onLoginClick }) => (
    <main>
      <h1>Landing</h1>
      <button type="button" onClick={onLoginClick}>
        Login CTA
      </button>
    </main>
  ),
}));

jest.mock("./pages/public/LoginPage", () => ({ __esModule: true, default: () => <h1>Login page</h1> }));
jest.mock("./pages/public/NotFoundPage", () => ({ __esModule: true, default: () => <h1>Not found page</h1> }));
jest.mock("./pages/admin/AdminDashboard", () => ({ __esModule: true, default: () => <h1>Admin area</h1> }));
jest.mock("./pages/sme/SMEDashboard", () => ({ __esModule: true, default: () => <h1>SME area</h1> }));
jest.mock("./pages/user/UserDashboard", () => ({ __esModule: true, default: () => <h1>User area</h1> }));
jest.mock("./auth/ProtectedRoute", () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

const renderApp = (initialEntry = "/") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="*" element={<App />} />
      </Routes>
    </MemoryRouter>,
  );

describe("App route shell", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders landing page and navigates to login from landing CTA", async () => {
    const user = userEvent.setup();
    renderApp("/");

    expect(screen.getByRole("heading", { name: "Landing" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Login CTA" }));

    expect(screen.getByRole("heading", { name: "Login page" })).toBeInTheDocument();
    expect(screen.getByTestId("toast-container")).toHaveAttribute("data-theme", "colored");
  });

  test.each([
    ["admin", "Admin area"],
    ["sme", "SME area"],
    ["user", "User area"],
    ["unknown", "User area"],
  ])("redirects authenticated %s users from root", (role, expectedHeading) => {
    localStorage.setItem("access", "token");
    localStorage.setItem("role", role);

    renderApp("/");

    expect(screen.getByRole("heading", { name: expectedHeading })).toBeInTheDocument();
  });

  test("redirects authenticated login visits and renders protected/not-found routes", () => {
    localStorage.setItem("access", "token");
    localStorage.setItem("role", "admin");

    const { unmount } = renderApp("/login");
    expect(screen.getByRole("heading", { name: "Admin area" })).toBeInTheDocument();
    unmount();

    localStorage.clear();
    renderApp("/missing-route");
    expect(screen.getByRole("heading", { name: "Not found page" })).toBeInTheDocument();
  });
});
