import axiosClient from "./axiosClient";

const loginApi = {
  register: (data) => axiosClient.post("/user/register", data),
  verifyEmail: (data) => axiosClient.post("/user/verify-email", data),
  resendOtp: (data) => axiosClient.post("/reend-otp", data),
  login: (data) => axiosClient.post("/auth/login", data),
  forgotPassword: (data) => axiosClient.post("/user/forgot-password", data),
  logout: (token) => {
    return axiosClient.post(
      "/auth/logout",
      {}, // body trống
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },
};
export default loginApi;
