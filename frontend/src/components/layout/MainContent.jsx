function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function MainContent({
  children,
  className = "",
  scrollClassName = "",
}) {
  return (
    <main className={joinClasses("cq-layout-main", className)}>
      <div className={joinClasses("cq-layout-scroll", scrollClassName)}>{children}</div>
    </main>
  );
}
