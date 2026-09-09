import "./layoutPrimitives.css";
import "./dockSidebar.css";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function AppShell({
  children,
  className = "",
  sidebarWidth = "72px",
  contentMaxWidth = "1180px",
  pageHorizontalPadding = "clamp(14px, 2vw, 24px)",
  pageVerticalPadding = "clamp(18px, 2vw, 26px)",
}) {
  return (
    <div
      className={joinClasses("cq-layout-shell", className)}
      style={{
        "--sidebar-width-base": sidebarWidth,
        "--cq-content-max-width": contentMaxWidth,
        "--cq-page-horizontal-padding": pageHorizontalPadding,
        "--cq-page-vertical-padding": pageVerticalPadding,
      }}
    >
      {children}
    </div>
  );
}
