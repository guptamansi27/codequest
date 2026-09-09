function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function SectionBlock({
  as = "section",
  children,
  className = "",
}) {
  const Component = as;

  return (
    <Component className={joinClasses("cq-section-block", className)}>
      {children}
    </Component>
  );
}
