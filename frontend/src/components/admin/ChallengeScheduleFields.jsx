import {
  formatScheduleDisplay,
  nowDatetimeLocal,
} from "../../utils/challengeSchedule";

const ScheduleDateTimeField = ({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  min,
}) => {
  const readableValue = formatScheduleDisplay(value);

  return (
    <label className={`challenge-field schedule-field${error ? " has-error" : ""}${disabled ? " is-disabled" : ""}`}>
      <span>{label}</span>
      <input
        type="datetime-local"
        value={value || ""}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      {(error || readableValue || helperText) && (
        <small className={error ? "schedule-field-error" : "schedule-field-helper"}>
          {error || readableValue || helperText}
        </small>
      )}
    </label>
  );
};

const ChallengeScheduleFields = ({
  start,
  end,
  onStartChange,
  onEndChange,
  errors = {},
  startLocked = false,
  endLocked = false,
  startHelper,
  endHelper,
}) => {
  const now = nowDatetimeLocal();

  return (
    <div className="schedule-grid two">
      <ScheduleDateTimeField
        label="Start Date & Time"
        value={start}
        onChange={onStartChange}
        error={errors.start}
        helperText={startLocked ? "Started challenges keep their original start time locked." : startHelper}
        disabled={startLocked}
        min={now}
      />
      <ScheduleDateTimeField
        label="End Date & Time"
        value={end}
        onChange={onEndChange}
        error={errors.end}
        helperText={endLocked ? "Completed challenges keep their original end time locked." : endHelper}
        disabled={endLocked}
        min={start || now}
      />
    </div>
  );
};

export default ChallengeScheduleFields;
