import "../../styles/cosmic-loader.css";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Unified orbit-style loader for dashboards, galaxy overlays, auth, inline chat, and icon-sized controls.
 * @param {"embed" | "page" | "compact" | "inline" | "icon"} variant
 */
export default function CosmicLoader({
  label = "Loading…",
  subtitle,
  variant = "page",
  className = "",
}) {
  const rootClass =
    variant === "embed"
      ? "cosmic-loader--embed"
      : variant === "compact"
        ? "cosmic-loader--compact"
        : variant === "inline"
          ? "cosmic-loader--inline"
          : variant === "icon"
            ? "cosmic-loader--icon"
            : "cosmic-loader--page";

  const orbits = (
    <div className="cosmic-loader-orbits" aria-hidden="true">
      <span />
      <span />
      <span />
      <i />
    </div>
  );

  if (variant === "icon") {
    return (
      <span
        className={joinClasses("cosmic-loader", rootClass, className)}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        {orbits}
      </span>
    );
  }

  return (
    <div
      className={joinClasses("cosmic-loader", rootClass, className)}
      role="status"
      aria-live="polite"
    >
      {orbits}
      <div className="cosmic-loader-text">
        <strong>{label}</strong>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
  );
}
