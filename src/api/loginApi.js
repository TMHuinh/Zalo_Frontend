import axiosClient from "./axiosClient";

const loginApi = {
    login: (data) => {
        return axiosClient.post("/auth/login", data);
    },
    register: (data) => {
        return axiosClient.post("/user/register", data);
        // ⚠️ sửa path nếu backend bạn khác
    },
    logout: (token) => {
        return axiosClient.post(
            "/auth/logout",
            {}, // body trống
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
    },
};

export default loginApi;