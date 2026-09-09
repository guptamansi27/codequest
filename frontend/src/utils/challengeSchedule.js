const pad2 = (value) => String(value).padStart(2, "0");

export const toDatetimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

export const toUtcIsoString = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

export const nowDatetimeLocal = () => toDatetimeLocal(new Date().toISOString());

export const formatScheduleDisplay = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const compareLocalDateTime = (left, right) => {
  const leftDate = left ? new Date(left) : null;
  const rightDate = right ? new Date(right) : null;
  if (!leftDate || !rightDate || Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) return null;
  return leftDate.getTime() - rightDate.getTime();
};

export const splitLocalDateTime = (value) => {
  if (!value) return { date: "", hour: "", minute: "", meridiem: "AM" };
  const [date = "", time = ""] = value.split("T");
  const [rawHour = "", rawMinute = ""] = time.split(":");
  const hour24 = Number(rawHour);
  if (!Number.isFinite(hour24)) return { date, hour: "", minute: rawMinute || "", meridiem: "AM" };
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return { date, hour: pad2(hour12), minute: rawMinute || "00", meridiem };
};

export const combineLocalDateTime = ({ date, hour, minute, meridiem }) => {
  if (!date || !hour || minute === "" || !meridiem) return "";
  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);
  if (
    !Number.isInteger(hourNumber) ||
    !Number.isInteger(minuteNumber) ||
    hourNumber < 1 ||
    hourNumber > 12 ||
    minuteNumber < 0 ||
    minuteNumber > 59
  ) {
    return "";
  }
  const hour24 = meridiem === "PM" ? (hourNumber % 12) + 12 : hourNumber % 12;
  return `${date}T${pad2(hour24)}:${pad2(minuteNumber)}`;
};

export const getScheduleErrors = ({
  start,
  end,
  mode = "create",
  originalStart = "",
  originalEnd = "",
  now = nowDatetimeLocal(),
}) => {
  const errors = {};
  const startChanged = mode !== "edit" || !originalStart || start !== originalStart;
  const endChanged = mode !== "edit" || !originalEnd || end !== originalEnd;
  const originalStartIsPast = originalStart && compareLocalDateTime(originalStart, now) < 0;
  const originalEndIsPast = originalEnd && compareLocalDateTime(originalEnd, now) < 0;

  if (!start) errors.start = "Please select challenge start date.";
  if (!end) errors.end = "Please select challenge end date.";

  if (start && startChanged && compareLocalDateTime(start, now) < 0) {
    errors.start = originalStartIsPast
      ? "Started challenges cannot modify start time."
      : "Start time must be greater than current time.";
  }

  if (end && endChanged && compareLocalDateTime(end, now) < 0) {
    errors.end = originalEndIsPast
      ? "Ended challenges cannot modify end time."
      : "Challenge cannot be rescheduled to a past time.";
  }

  if (start && end && compareLocalDateTime(end, start) <= 0) {
    errors.end = end.split("T")[0] < start.split("T")[0]
      ? "End date cannot be before start date."
      : "End time must be after start time.";
  }

  return errors;
};

export const isStarted = (start, now = nowDatetimeLocal()) =>
  Boolean(start && compareLocalDateTime(start, now) < 0);

export const isEnded = (end, now = nowDatetimeLocal()) =>
  Boolean(end && compareLocalDateTime(end, now) < 0);
