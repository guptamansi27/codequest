import aiService from "./aiService";
import api from "../api/axiosInstance";

jest.mock("../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe("aiService", () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  test("requests generated test cases and returns response data", async () => {
    api.post.mockResolvedValueOnce({ data: { tests: [{ name: "Hero" }] } });

    await expect(
      aiService.generateTestCases({
        title: "Landing",
        description: "Hero",
        technology: "html",
        difficulty: "Easy",
      }),
    ).resolves.toEqual({ tests: [{ name: "Hero" }] });

    expect(api.post).toHaveBeenCalledWith("/ai/generate-testcases/", {
      title: "Landing",
      description: "Hero",
      technology: "html",
      difficulty: "Easy",
    });
  });

  test("sends challenge chat context and returns response data", async () => {
    api.post.mockResolvedValueOnce({ data: { reply: "Try using a button" } });

    await expect(
      aiService.challengeChat({
        challengeId: 10,
        message: "Help",
        currentCode: "<button />",
      }),
    ).resolves.toEqual({ reply: "Try using a button" });

    expect(api.post).toHaveBeenCalledWith("/ai/challenge-chat/", {
      challengeId: 10,
      message: "Help",
      currentCode: "<button />",
    });
  });
});
