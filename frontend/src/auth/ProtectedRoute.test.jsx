import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

const renderProtected = ({ role, access = "token", allowedRoles = ["user"], path = "/protected" } = {}) => {
  localStorage.clear();
  if (access) localStorage.setItem("access", access);
  if (role) localStorage.setItem("role", role);

  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <h1>Protected content</h1>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<h1>Login redirect</h1>} />
        <Route path="/admin" element={<h1>Admin redirect</h1>} />
        <Route path="/sme" element={<h1>SME redirect</h1>} />
        <Route path="/user" element={<h1>User redirect</h1>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("auth ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("redirects missing sessions to login and renders matching roles", () => {
    const { unmount } = renderProtected({ access: "", role: "" });
    expect(screen.getByRole("heading", { name: "Login redirect" })).toBeInTheDocument();
    unmount();

    renderProtected({ role: "USER", allowedRoles: ["user"] });
    expect(screen.getByRole("heading", { name: "Protected content" })).toBeInTheDocument();
  });

  test.each([
    ["admin", ["user"], "Admin redirect"],
    ["sme", ["user"], "SME redirect"],
    ["user", ["admin"], "User redirect"],
    ["auditor", ["admin"], "Login redirect"],
  ])("redirects mismatched %s role to the right home", (role, allowedRoles, expectedHeading) => {
    renderProtected({ role, allowedRoles });

    expect(screen.getByRole("heading", { name: expectedHeading })).toBeInTheDocument();
  });
});
