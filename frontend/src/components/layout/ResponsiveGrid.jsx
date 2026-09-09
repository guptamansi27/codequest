function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function ResponsiveGrid({
  children,
  className = "",
  min = "240px",
  gap,
  columns,
}) {
  const style = {
    "--cq-grid-min": min,
  };

  if (gap) {
    style["--cq-grid-gap"] = gap;
  }

  if (columns) {
    style["--cq-grid-template"] = `repeat(${columns}, minmax(0, 1fr))`;
  }

  return (
    <div className={joinClasses("cq-responsive-grid", className)} style={style}>
      {children}
    </div>
  );
}
