const clientErrorEvents = [];
const MAX_CLIENT_ERROR_EVENTS = 20;

export function handleApplicationError(message, metadata = {}) {
  const safeMessage = typeof message === "string" && message.trim()
    ? message.trim()
    : "Application request failed";
  clientErrorEvents.push({
    message: safeMessage,
    metadata: Object.fromEntries(
      Object.entries(metadata).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)),
    ),
    occurredAt: new Date().toISOString(),
  });

  if (clientErrorEvents.length > MAX_CLIENT_ERROR_EVENTS) {
    clientErrorEvents.shift();
  }

  return safeMessage;
}

export function getClientErrorEvents() {
  return [...clientErrorEvents];
}
