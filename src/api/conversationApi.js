import axiosClient from "./axiosClient";

const conversationApi = {
  getByUserId: () => {
    return axiosClient.get("/conversation/getByUserId");
  },

  createGroup: (data) => {
    return axiosClient.post("/conversation/group", data);
  },
};

export default conversationApi;
