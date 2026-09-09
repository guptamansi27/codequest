import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axiosInstance";
import LoginPage from "./LoginPage";

jest.mock("../../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<h1>Admin route</h1>} />
        <Route path="/sme" element={<h1>SME route</h1>} />
        <Route path="/user" element={<h1>User route</h1>} />
      </Routes>
    </MemoryRouter>,
  );

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    api.post.mockReset();
    toast.error.mockClear();
    toast.success.mockClear();
  });

  test("validates email and required password before submitting", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "Strong1!");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(toast.error).toHaveBeenCalledWith("Enter a valid email address.", expect.any(Object));
    expect(api.post).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "learner@example.com");
    await user.clear(screen.getByLabelText("Password"));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(toast.error).toHaveBeenCalledWith("Password is required.", expect.any(Object));
    expect(api.post).not.toHaveBeenCalled();
  });

  test("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderLogin();

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  test.each([
    ["ADMIN", "Admin route"],
    ["SME", "SME route"],
    ["USER", "User route"],
  ])("logs in and routes %s users", async (role, expectedRoute) => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({
      status: 200,
      data: {
        access: "access-token",
        refresh: "refresh-token",
        role,
      },
    });

    renderLogin();

    await user.type(screen.getByLabelText("Email"), " learner@example.com ");
    await user.type(screen.getByLabelText("Password"), "Strong1!");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: expectedRoute })).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/auth/login/", {
      email: "learner@example.com",
      password: "Strong1!",
    });
    expect(localStorage.getItem("access")).toBe("access-token");
    expect(localStorage.getItem("refresh")).toBe("refresh-token");
    expect(localStorage.getItem("role")).toBe(role.toLowerCase());
    expect(localStorage.getItem("email")).toBe("learner@example.com");
    expect(toast.success).toHaveBeenCalledWith(`Login successful. Welcome back, ${role}!`, expect.any(Object));
  });

  test("shows backend login errors and re-enables the form", async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValue({ response: { data: { detail: "Invalid credentials" } } });

    renderLogin();

    await user.type(screen.getByLabelText("Email"), "learner@example.com");
    await user.type(screen.getByLabelText("Password"), "Strong1!");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Invalid credentials", expect.any(Object)));
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });
});
