import challengeService from "./challengeService";
import api from "../api/axiosInstance";

jest.mock("../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe("challengeService", () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  test("posts challenge creation payload to backend endpoint", async () => {
    const payload = { title: "CSS Grid", difficulty: "Medium" };
    const response = { data: { id: 12 } };
    api.post.mockResolvedValueOnce(response);

    await expect(challengeService.createChallenge(payload)).resolves.toBe(response);

    expect(api.post).toHaveBeenCalledWith("/challenges/", payload);
  });
});
