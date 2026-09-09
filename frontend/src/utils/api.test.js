import axios from "axios";
import api from "./api";

jest.mock("axios", () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

describe("legacy api helper", () => {
  beforeEach(() => {
    delete globalThis.__CODEQUEST_API_BASE_URL__;
    jest.resetModules();
  });

  test("reuses the centralized axios client", () => {
    expect(axios.create).toHaveBeenCalledWith({ baseURL: "http://127.0.0.1:8000/api" });
    expect(api.get).toEqual(expect.any(Function));
    expect(api.interceptors.request.use).toHaveBeenCalled();
  });
});
