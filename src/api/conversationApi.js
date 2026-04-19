import axiosClient from "./axiosClient";

const conversationApi = {
  getByUserId: () => {
    return axiosClient.get("/conversation/getByUserId");
  },

  createGroup: (data) => {
    return axiosClient.post("/conversation/group", data);
  },
  pinMessage: (data) => {
    return axiosClient.post("/conversation/pin", data);
  },
  unpinMessage: (data) => {
    return axiosClient.delete("/conversation/pin", {
      data,
    });
  },
  getPinnedMessages: (conversationId) => {
    return axiosClient.get(`/conversation/pinned/${conversationId}`);
  },
};

export default conversationApi;
