import "./ProgramToggle.css";

const options = [
  { value: "IGNITE", label: "Ignite" },
  { value: "NON_IGNITE", label: "Non Ignite" },
];

const ProgramToggle = ({ value, onChange, disabled = false, className = "" }) => (
  <div className={`program-toggle ${className}`} role="tablist" aria-label="Program type">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="tab"
        aria-selected={value === option.value}
        className={`program-toggle-option${value === option.value ? " is-active" : ""}`}
        disabled={disabled}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default ProgramToggle;
