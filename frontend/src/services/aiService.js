import api from "../api/axiosInstance";

const aiService = {
  generateTestCases: async ({ title, description, technology, difficulty }) => {
    const response = await api.post("/ai/generate-testcases/", {
      title,
      description,
      technology,
      difficulty,
    });
    return response.data;
  },
  validateTestCaseAccuracy: async ({ title, description, technology, difficulty, testcases }) => {
    const response = await api.post("/ai/validate-testcase-accuracy/", {
      title,
      description,
      technology,
      difficulty,
      testcases,
    });
    return response.data;
  },
  challengeChat: async ({ challengeId, message, currentCode }) => {
    const response = await api.post("/ai/challenge-chat/", {
      challengeId,
      message,
      currentCode,
    });
    return response.data;
  },
};

export default aiService;
