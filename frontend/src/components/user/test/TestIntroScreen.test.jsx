import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestIntroScreen } from "./TestIntroScreen";

describe("TestIntroScreen", () => {
  test("renders assessment details, instructions, and starts the test", async () => {
    const user = userEvent.setup();
    const onStartTest = jest.fn();

    render(<TestIntroScreen onStartTest={onStartTest} />);

    expect(screen.getByRole("heading", { name: /html & css test/i })).toBeInTheDocument();
    expect(screen.getByText("Questions")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText(/Write clean and working code/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start test/i }));
    expect(onStartTest).toHaveBeenCalledTimes(1);
  });
});
