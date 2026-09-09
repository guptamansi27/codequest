import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AuthProtectedRoute from "../../auth/ProtectedRoute";
import LandingPage from "./LandingPage";
import NotFoundPage from "./NotFoundPage";
import PublicProtectedRoute from "./ProtectedRoute";
import UnauthorizedPage from "./UnauthorizedPage";

describe("public pages and protected routes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders landing page and triggers login from CTAs", async () => {
    const user = userEvent.setup();
    const onLoginClick = jest.fn();

    render(<LandingPage onLoginClick={onLoginClick} />);

    expect(screen.getByRole("heading", { name: "CodeQuest" })).toBeInTheDocument();
    expect(screen.getByText("Why Choose CodeQuest?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start Your Quest" }));
    await user.click(screen.getByRole("button", { name: "Start Learning Now" }));
    expect(onLoginClick).toHaveBeenCalledTimes(2);
  });

  test("not found page navigates back home", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/missing"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<div>Home route</div>} />
          <Route path="/missing" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Page Not Found" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /back to home/i }));
    expect(screen.getByText("Home route")).toBeInTheDocument();
  });

  test("unauthorized page navigates to configured dashboard", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/unauthorized"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/admin" element={<div>Admin dashboard</div>} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Access Denied" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /go to dashboard/i }));
    expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
  });

  test("public protected route redirects without stored user and renders matching role", () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/admin-only"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/admin-only"
            element={
              <PublicProtectedRoute role="admin">
                <div>Protected content</div>
              </PublicProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
    unmount();

    localStorage.setItem("user", JSON.stringify({ role: "admin" }));
    render(
      <MemoryRouter initialEntries={["/admin-only"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/admin-only"
            element={
              <PublicProtectedRoute role="admin">
                <div>Protected content</div>
              </PublicProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  test("auth protected route allows matching roles and redirects mismatches", () => {
    localStorage.setItem("access", "token");
    localStorage.setItem("role", "user");

    const { rerender } = render(
      <MemoryRouter initialEntries={["/user"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/user"
            element={
              <AuthProtectedRoute allowedRoles={["user"]}>
                <div>User area</div>
              </AuthProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("User area")).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={["/admin"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AuthProtectedRoute allowedRoles={["admin"]}>
                <div>Admin area</div>
              </AuthProtectedRoute>
            }
          />
          <Route path="/user" element={<div>User redirect</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("User redirect")).toBeInTheDocument();
  });
});
