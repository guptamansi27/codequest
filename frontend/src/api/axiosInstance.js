import axios from "axios"
import { API_BASE_URL } from "../config/apiConfig"
import { notify } from "../utils/notifications"

const api = axios.create({
    baseURL: API_BASE_URL
})

const publicApi = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refresh = localStorage.getItem("refresh");

    if (
      error.response?.status === 401 &&
      refresh &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/token/refresh/")
    ) {
      originalRequest._retry = true;

      try {
        const { data } = await publicApi.post("/auth/token/refresh/", {
          refresh,
        });

        localStorage.setItem("access", data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        notify.error("Your session has expired. Please login again.", { toastId: "session-expired" });
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
