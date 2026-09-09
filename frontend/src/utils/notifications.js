import { toast } from "react-toastify";
import { handleApplicationError } from "./safeLogger";

const STATUS_MESSAGES = {
  400: "Please review the highlighted fields.",
  401: "Your session has expired. Please login again.",
  403: "You do not have permission to perform this action.",
  404: "The requested item was not found.",
  408: "Request timed out. Please try again.",
  409: "This action conflicts with existing data.",
  500: "Server error. Please try again later.",
};

const FIELD_LABELS = {
  start_time: "Start time",
  end_time: "End time",
  employee_id: "Employee ID",
  employee_ids: "Employee IDs",
  non_field_errors: "",
  target_super_batches: "Super batch",
  target_batches: "Batch",
  target_sub_batches: "Sub-batch",
  assignment_mode: "Assignment mode",
  xp_points: "XP points",
};

function asArray(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.flatMap(asArray);
  if (typeof value === "object") return flattenErrors(value);
  return [String(value)];
}

function humanizeField(field) {
  if (!field || field === "non_field_errors") return "";
  return FIELD_LABELS[field] || field.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function flattenErrors(errors) {
  if (!errors || typeof errors !== "object") return [];
  return Object.entries(errors).flatMap(([field, value]) => {
    const label = humanizeField(field);
    return asArray(value).map((message) => (label && !message.toLowerCase().startsWith(label.toLowerCase())
      ? `${label}: ${message}`
      : message));
  });
}

export function getApiErrorMessages(error, fallback = "Request failed. Please try again.") {
  if (error?.code === "ECONNABORTED") return ["Request timed out. Please try again."];
  if (error?.message === "Network Error" || (error && !error.response)) {
    return ["Unable to connect to server."];
  }

  const status = error?.response?.status;
  const data = error?.response?.data ?? error;

  if (typeof data === "string" && data.trim()) return [data.trim()];
  if (data?.errors) {
    const messages = flattenErrors(data.errors);
    if (messages.length) return messages;
  }
  if (data?.field && data?.message) {
    const label = humanizeField(data.field);
    return [label && !data.message.toLowerCase().startsWith(label.toLowerCase()) ? `${label}: ${data.message}` : data.message];
  }
  if (data?.message) return [String(data.message)];
  if (data?.detail) return [String(data.detail)];
  if (data?.error) return [String(data.error)];

  const fieldMessages = flattenErrors(data);
  if (fieldMessages.length) return fieldMessages;

  return [STATUS_MESSAGES[status] || fallback];
}

function show(type, message, options) {
  const safeMessage = message || "Request failed. Please try again.";
  const notifier = toast[type] || toast;
  if (typeof notifier === "function") notifier(safeMessage, options);
  return safeMessage;
}

export const notify = {
  success: (message, options) => show("success", message, options),
  warning: (message, options) => show("warning", message, options),
  info: (message, options) => show("info", message, options),
  error: (message, options) => show("error", message, options),
  validation: (messageOrError, fallback, options) => {
    const message = typeof messageOrError === "string"
      ? messageOrError
      : getApiErrorMessages(messageOrError, fallback)[0];
    return show("error", message, options);
  },
  apiError: (error, fallback = "Request failed. Please try again.", options = {}) => {
    const messages = getApiErrorMessages(error, fallback);
    handleApplicationError(messages[0], {
      status: error?.response?.status,
      url: error?.config?.url,
    });
    show("error", messages[0], options);
    return messages;
  },
};
