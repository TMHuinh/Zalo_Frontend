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
  searchByPhone: (phone) => {
    return axiosClient.get(`/user/search?phone=${phone}`);
  },
  updateUser: (id, data) => {
    return axiosClient.put(`/user/${id}`, data);

  }
};

export default userApi;
