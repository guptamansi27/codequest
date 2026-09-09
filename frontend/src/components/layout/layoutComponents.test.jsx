import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppShell from "./AppShell";
import ContentWrapper from "./ContentWrapper";
import DashboardContainer from "./DashboardContainer";
import DockNavItem from "./DockNavItem";
import MainContent from "./MainContent";
import PageContainer from "./PageContainer";
import ResponsiveGrid from "./ResponsiveGrid";
import SectionBlock from "./SectionBlock";
import Sidebar from "./Sidebar";
import SidebarLayout from "./SidebarLayout";

jest.mock("motion/react", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  useReducedMotion: () => true,
}));

describe("layout primitives", () => {
  test("renders app shell with layout variables", () => {
    const { container } = render(
      <AppShell className="custom-shell" sidebarWidth="80px">
        <span>Shell content</span>
      </AppShell>,
    );

    const shell = container.firstChild;
    expect(shell).toHaveClass("cq-layout-shell", "custom-shell");
    expect(shell).toHaveStyle({ "--sidebar-width-base": "80px" });
    expect(screen.getByText("Shell content")).toBeInTheDocument();
  });

  test("renders content and main wrappers with custom classes", () => {
    render(
      <MainContent className="main-x" scrollClassName="scroll-x">
        <ContentWrapper className="content-x" gap="20px">
          Wrapped
        </ContentWrapper>
      </MainContent>,
    );

    expect(screen.getByRole("main")).toHaveClass("cq-layout-main", "main-x");
    const content = screen.getByText("Wrapped").closest(".cq-content-wrapper");
    expect(content).toHaveClass("cq-content-wrapper", "content-x");
    expect(content).toHaveStyle({ "--cq-content-gap": "20px" });
  });

  test("renders dashboard, page, grid, section, and sidebar primitives", () => {
    render(
      <>
        <DashboardContainer as="article" className="dash-x" maxWidth="900px">
          Dashboard
        </DashboardContainer>
        <PageContainer>Page</PageContainer>
        <ResponsiveGrid className="grid-x" columns={3} min="180px" gap="12px">
          Grid
        </ResponsiveGrid>
        <SectionBlock as="div" className="section-x">
          Section
        </SectionBlock>
        <Sidebar className="side-x">Sidebar</Sidebar>
      </>,
    );

    expect(screen.getByText("Dashboard").closest("article")).toHaveClass("cq-dashboard-container", "dash-x");
    expect(screen.getByText("Dashboard").closest("article")).toHaveStyle({ "--cq-dashboard-max-width": "900px" });
    expect(screen.getByText("Page").closest(".cq-dashboard-container")).toBeInTheDocument();
    expect(screen.getByText("Grid")).toHaveClass("cq-responsive-grid", "grid-x");
    expect(screen.getByText("Grid")).toHaveStyle({
      "--cq-grid-min": "180px",
      "--cq-grid-gap": "12px",
      "--cq-grid-template": "repeat(3, minmax(0, 1fr))",
    });
    expect(screen.getByText("Section")).toHaveClass("cq-section-block", "section-x");
    expect(screen.getByText("Sidebar").closest(".cq-layout-sidebar-surface")).toHaveClass(
      "cq-layout-sidebar-surface",
      "side-x",
    );
  });

  test("composes sidebar layout", () => {
    render(
      <SidebarLayout sidebar={<button>Nav</button>} className="shell-x" mainClassName="main-x">
        Body
      </SidebarLayout>,
    );

    expect(screen.getByText("Nav")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveClass("main-x");
  });

  test("shows dock label on hover and hides it on leave", async () => {
    const user = userEvent.setup();
    render(
      <DockNavItem label="Reports">
        <button>R</button>
      </DockNavItem>,
    );

    await user.hover(screen.getByRole("button", { name: "R" }).parentElement);
    expect(screen.getByText("Reports")).toBeInTheDocument();

    await user.unhover(screen.getByRole("button", { name: "R" }).parentElement);
    expect(screen.queryByText("Reports")).not.toBeInTheDocument();
  });
});
