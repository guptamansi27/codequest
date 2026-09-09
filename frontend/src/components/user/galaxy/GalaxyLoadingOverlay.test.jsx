import { render, screen } from "@testing-library/react";
import GalaxyLoadingOverlay from "./GalaxyLoadingOverlay";

describe("GalaxyLoadingOverlay", () => {
  test("renders default and custom loading labels", () => {
    const { rerender } = render(<GalaxyLoadingOverlay />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading galaxy data...");
    expect(screen.getByText("Syncing your universe from the database")).toBeInTheDocument();

    rerender(<GalaxyLoadingOverlay label="Loading HTML Galaxy" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading HTML Galaxy");
  });
});
