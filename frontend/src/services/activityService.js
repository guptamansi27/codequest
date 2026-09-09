import api from "../api/axiosInstance";

const ALLOWED_ACTIONS = new Set(["START", "RESUME", "OPEN", "EXIT", "EXECUTE_TESTS", "RUNTIME_FAILURE"]);

export async function trackChallengeActivity(challengeId, action, metadata = {}) {
  if (!challengeId || !ALLOWED_ACTIONS.has(action)) return;
  const payload = {
    action,
  };

  if (Number.isFinite(metadata.durationSeconds)) {
    payload.duration_seconds = Math.max(0, Math.round(metadata.durationSeconds));
  }

  try {
    await api.post(`/challenges/${challengeId}/activity/`, payload);
  } catch {
    // Activity tracking must never interrupt the learner workflow.
  }
}
