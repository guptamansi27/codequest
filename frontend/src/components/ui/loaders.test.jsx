import { render, screen } from "@testing-library/react";
import CosmicLoader from "./CosmicLoader";
import {
  AuthSkeleton,
  ChallengeGridSkeleton,
  DashboardSkeleton,
  InlineButtonSkeleton,
  LeaderboardSkeleton,
  ReportsSkeleton,
  SkeletonBlock,
  TableSkeleton,
  WorkspaceSkeleton,
} from "./PremiumSkeleton";

describe("shared loaders and skeletons", () => {
  test("renders page, icon, and embed cosmic loader variants", () => {
    const { rerender } = render(<CosmicLoader label="Loading dashboard" subtitle="Please wait" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading dashboard");
    expect(screen.getByText("Please wait")).toBeInTheDocument();

    rerender(<CosmicLoader variant="icon" label="Saving" />);
    expect(screen.getByRole("status", { name: "Saving" })).toHaveClass("cosmic-loader--icon");

    rerender(<CosmicLoader variant="embed" label="Loading galaxy" />);
    expect(screen.getByRole("status")).toHaveClass("cosmic-loader--embed");
  });

  test("renders skeleton blocks and page skeleton status labels", () => {
    const { container } = render(
      <>
        <SkeletonBlock data-testid="block" rounded="full" />
        <DashboardSkeleton role="user" />
        <ReportsSkeleton role="admin" />
        <TableSkeleton rows={2} cols={3} />
        <ChallengeGridSkeleton count={2} />
        <LeaderboardSkeleton />
        <WorkspaceSkeleton label="Loading workspace data" />
        <AuthSkeleton />
        <InlineButtonSkeleton />
      </>,
    );

    expect(screen.getByTestId("block")).toHaveClass("cq-skel--full");
    expect(screen.getByLabelText("Loading user dashboard")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading admin reports")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Loading table").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText("Loading challenges")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading leaderboard")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading workspace data")).toBeInTheDocument();
    expect(screen.getByLabelText("Authenticating")).toBeInTheDocument();
    expect(container.querySelector(".cq-skel-button-dot")).toBeInTheDocument();
  });
});
