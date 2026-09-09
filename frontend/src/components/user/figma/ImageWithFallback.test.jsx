import { fireEvent, render, screen } from "@testing-library/react";
import { ImageWithFallback } from "./ImageWithFallback";

describe("ImageWithFallback", () => {
  test("renders the original image until it errors", () => {
    render(<ImageWithFallback src="/avatar.png" alt="User avatar" className="avatar" />);

    const image = screen.getByRole("img", { name: "User avatar" });
    expect(image).toHaveAttribute("src", "/avatar.png");
    expect(image).toHaveClass("avatar");
  });

  test("renders fallback image after load error", () => {
    render(<ImageWithFallback src="/broken.png" alt="Broken avatar" />);

    fireEvent.error(screen.getByRole("img", { name: "Broken avatar" }));

    const fallback = screen.getByRole("img", { name: "Error loading image" });
    expect(fallback).toHaveAttribute("data-original-url", "/broken.png");
    expect(fallback).toHaveAttribute("src", expect.stringContaining("data:image/svg+xml"));
  });
});
