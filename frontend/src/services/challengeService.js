import api from "../api/axiosInstance";

const challengeService = {
  createChallenge: async (payload) => {
    // Backend integration point
    return api.post("/challenges/", payload);
  },
};

export default challengeService;
