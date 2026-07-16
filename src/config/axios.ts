import axios from "axios";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import { decodeAccessToken } from "@/utils/jwt";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    withcredentials: true,
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getCookie("access_token");
    console.log(token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: any = error.config;

    console.log("Response Status:", error.response?.status);
    console.log("Request URL:", originalRequest?.url);

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/refresh")
    ) {
      originalRequest._retry = true;

      try {
        console.log("Refreshing access token...");

        const refreshToken = getCookie("refresh_token");

     

        if (!refreshToken) {
          throw new Error("Refresh token not found");
        }

        const refreshResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/refresh`,
          {
            refresh_token: refreshToken,
          }
        );

        console.log("Refresh API Response:", refreshResponse.data);

        const newAccessToken = refreshResponse.data.access_token;
        console.log("New Access Token:", newAccessToken);
        if (!newAccessToken) {
          throw new Error("Access token not returned from refresh API");
        }

        const payload = decodeAccessToken(newAccessToken);

        setCookie("access_token", newAccessToken);
        setCookie("client_id", payload.client_id);
        setCookie("client_role", payload.client_role);

        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        console.log("Retrying original request...");

        return axiosInstance(originalRequest);
      } catch (err: any) {
        console.error("Refresh Failed");

        if (axios.isAxiosError(err)) {
          console.error("Status:", err.response?.status);
          console.error("Response:", err.response?.data);
          console.error("Message:", err.message);
        } else {
          console.error(err);
        }

        deleteCookie("access_token");
        deleteCookie("refresh_token");
        deleteCookie("client_id");
        deleteCookie("client_role");

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;