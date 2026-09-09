import api from "../api/axiosInstance";

export const formatTimer = (seconds = 0) => {
  const total = Math.max(Math.floor(Number(seconds) || 0), 0);
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const secs = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${secs}`;
};

const challengeTimerService = {
  open: async (challengeId) => {
    const response = await api.post(`/challenges/${challengeId}/timer/`, { action: "open" });
    return response.data;
  },
  sync: async (challengeId) => {
    const response = await api.post(`/challenges/${challengeId}/timer/`, { action: "sync" });
    return response.data;
  },
  close: async (challengeId) => {
    const response = await api.post(`/challenges/${challengeId}/timer/`, { action: "close" });
    return response.data;
  },
};

export default challengeTimerService;
