import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Navbar from "./Navbar";

describe("Navbar", () => {
  test("renders the CodeQuest brand and login button", () => {
    render(<Navbar onLoginClick={jest.fn()} />);

    expect(screen.getByText("CodeQuest")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  test("calls the login handler when Login is clicked", async () => {
    const user = userEvent.setup();
    const onLoginClick = jest.fn();

    render(<Navbar onLoginClick={onLoginClick} />);
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(onLoginClick).toHaveBeenCalledTimes(1);
  });
});
