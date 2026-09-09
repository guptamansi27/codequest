function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function ContentWrapper({
  children,
  className = "",
  gap,
}) {
  return (
    <div
      className={joinClasses("cq-content-wrapper", className)}
      style={gap ? { "--cq-content-gap": gap } : undefined}
    >
      {children}
    </div>
  );
}
