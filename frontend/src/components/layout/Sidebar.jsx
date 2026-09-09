function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function Sidebar({
  children,
  className = "",
}) {
  return (
    <aside className="cq-layout-sidebar">
      <div className={joinClasses("cq-layout-sidebar-surface", className)}>
        {children}
      </div>
    </aside>
  );
}
