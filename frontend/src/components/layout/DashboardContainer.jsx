function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function DashboardContainer({
  as = "section",
  children,
  className = "",
  maxWidth,
}) {
  const Component = as;

  return (
    <Component
      className={joinClasses("cq-dashboard-container", className)}
      style={maxWidth ? { "--cq-dashboard-max-width": maxWidth } : undefined}
    >
      <div className="cq-dashboard-container__inner">{children}</div>
    </Component>
  );
}
