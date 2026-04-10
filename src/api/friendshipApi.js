import axiosClient from "./axiosClient";

const friendshipApi = {
  sendRequest: (addresseeId) =>
    axiosClient.post("/friendship/request", { addresseeId }),

  sendRequestByPhone: (phone) =>
    axiosClient.post("/friendship/request-by-phone", { phone }),

  acceptRequest: (friendshipId) =>
    axiosClient.post("/friendship/accept", { friendshipId }),

  rejectRequest: (friendshipId) =>
    axiosClient.post("/friendship/reject", { friendshipId }),

  getFriends: () => axiosClient.get("/friendship/friends"),

  getPending: () => axiosClient.get("/friendship/pending"),
};

export default friendshipApi;