import axiosClient from "./axiosClient";

const userApi = {
    getById: (id) => {
        return axiosClient.get(`/user/${id}`);
    },

    changePassword: ({ oldPassword, newPassword, confirmPassword }) =>
        axiosClient.patch("/user/change-password", {
            oldPassword,
            newPassword,
            confirmPassword,
        }),
};

export default userApi;