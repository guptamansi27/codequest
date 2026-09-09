import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestConfirmationModal } from "./TestConfirmationModal";

describe("TestConfirmationModal", () => {
  afterEach(() => {
    document.body.className = "";
  });

  test("renders nothing when closed", () => {
    render(<TestConfirmationModal open={false} onConfirm={jest.fn()} onCancel={jest.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass("challenge-modal-open");
  });

  test("renders an accessible dialog and locks modal scrolling when open", () => {
    render(<TestConfirmationModal open onConfirm={jest.fn()} onCancel={jest.fn()} />);

    expect(screen.getByRole("dialog", { name: /ready to start the test/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start now/i })).toBeInTheDocument();
    expect(document.body).toHaveClass("challenge-modal-open");
  });

  test("calls cancel and confirm handlers from modal actions", async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    const onConfirm = jest.fn();

    render(<TestConfirmationModal open onConfirm={onConfirm} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await user.click(screen.getByRole("button", { name: /start now/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("removes the body modal class on unmount", async () => {
    const { unmount } = render(<TestConfirmationModal open onConfirm={jest.fn()} onCancel={jest.fn()} />);

    expect(document.body).toHaveClass("challenge-modal-open");
    unmount();

    await waitFor(() => expect(document.body).not.toHaveClass("challenge-modal-open"));
  });
});
