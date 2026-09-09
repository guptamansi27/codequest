const makeAxiosMock = () => {
  const instances = [];
  const create = jest.fn(() => {
    const instance = jest.fn((config) => Promise.resolve({ replayed: config }));
    instance.interceptors = {
      request: { use: jest.fn((handler) => { instance.requestHandler = handler; }) },
      response: { use: jest.fn((success, failure) => {
        instance.responseSuccess = success;
        instance.responseFailure = failure;
      }) },
    };
    instance.post = jest.fn();
    instances.push(instance);
    return instance;
  });

  return { create, instances };
};

const loadApiWithAxios = (axiosMock) => {
  jest.resetModules();
  jest.doMock("axios", () => ({
    __esModule: true,
    default: {
      create: axiosMock.create,
    },
  }));

  return require("./axiosInstance").default;
};

describe("axiosInstance", () => {
  beforeEach(() => {
    delete globalThis.__CODEQUEST_API_BASE_URL__;
    localStorage.clear();
    jest.resetModules();
    jest.dontMock("axios");
  });

  test("configures API clients and attaches bearer token on requests", () => {
    const axiosMock = makeAxiosMock();
    loadApiWithAxios(axiosMock);
    const [api] = axiosMock.instances;

    expect(axiosMock.create).toHaveBeenCalledWith({ baseURL: "http://127.0.0.1:8000/api" });
    expect(api.interceptors.request.use).toHaveBeenCalled();

    localStorage.setItem("access", "access-token");
    const config = api.requestHandler({ headers: {} });

    expect(config.headers.Authorization).toBe("Bearer access-token");
  });

  test("returns successful responses unchanged", () => {
    const axiosMock = makeAxiosMock();
    loadApiWithAxios(axiosMock);
    const [api] = axiosMock.instances;
    const response = { data: { ok: true } };

    expect(api.responseSuccess(response)).toBe(response);
  });

  test("refreshes expired access tokens and replays the original request", async () => {
    const axiosMock = makeAxiosMock();
    const exportedApi = loadApiWithAxios(axiosMock);
    const [api, publicApi] = axiosMock.instances;
    localStorage.setItem("refresh", "refresh-token");
    publicApi.post.mockResolvedValue({ data: { access: "new-access-token" } });

    const originalRequest = { url: "/dashboard/user/", headers: {} };
    const result = await api.responseFailure({
      config: originalRequest,
      response: { status: 401 },
    });

    expect(publicApi.post).toHaveBeenCalledWith("/auth/token/refresh/", { refresh: "refresh-token" });
    expect(localStorage.getItem("access")).toBe("new-access-token");
    expect(originalRequest._retry).toBe(true);
    expect(originalRequest.headers.Authorization).toBe("Bearer new-access-token");
    expect(exportedApi).toHaveBeenCalledWith(originalRequest);
    expect(result).toEqual({ replayed: originalRequest });
  });

  test("clears session and redirects when refresh fails", async () => {
    const axiosMock = makeAxiosMock();
    loadApiWithAxios(axiosMock);
    const [api, publicApi] = axiosMock.instances;
    localStorage.setItem("access", "old-access");
    localStorage.setItem("refresh", "bad-refresh");
    localStorage.setItem("role", "user");
    localStorage.setItem("email", "learner@tcs.com");
    const refreshError = new Error("refresh failed");
    publicApi.post.mockRejectedValue(refreshError);

    await expect(api.responseFailure({
      config: { url: "/dashboard/user/", headers: {} },
      response: { status: 401 },
    })).rejects.toBe(refreshError);

    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
    expect(localStorage.getItem("email")).toBeNull();
  });

  test("rejects non-refreshable errors", async () => {
    const axiosMock = makeAxiosMock();
    loadApiWithAxios(axiosMock);
    const [api, publicApi] = axiosMock.instances;
    const error = { config: { url: "/auth/token/refresh/" }, response: { status: 401 } };

    await expect(api.responseFailure(error)).rejects.toBe(error);
    expect(publicApi.post).not.toHaveBeenCalled();
  });

  test("normalizes HTTPS localhost runtime API URLs to HTTP", () => {
    globalThis.__CODEQUEST_API_BASE_URL__ = "https://localhost:8000/api/";
    const axiosMock = makeAxiosMock();
    loadApiWithAxios(axiosMock);

    expect(axiosMock.create).toHaveBeenCalledWith({ baseURL: "http://localhost:8000/api" });

    delete globalThis.__CODEQUEST_API_BASE_URL__;
  });
});
