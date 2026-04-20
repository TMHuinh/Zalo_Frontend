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
  deleteConversation: (conversationId) => {
    return axiosClient.delete(`/conversation/${conversationId}/clear`);
  },
  getGroupMembers: (conversationId) => {
    return axiosClient.get(`/conversation/${conversationId}/members`);
  },
  updateGroupInfo: (conversationId, formData) => {
    return axiosClient.patch(
      `/conversation/group/${conversationId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  },
  removeMember: (conversationId, memberId) => {
    return axiosClient.delete(
      `/conversation/${conversationId}/members/${memberId}`,
    );
  },
  assignOwner: (conversationId, memberId) => {
    return axiosClient.patch(`/conversation/${conversationId}/owner`, {
      memberId,
    });
  },
  disbandGroup: (conversationId) => {
    return axiosClient.delete(`/conversation/${conversationId}/disband`);
  },
  addMembers: (conversationId, memberIds) => {
    return axiosClient.post(`/conversation/${conversationId}/members`, {
      memberIds,
    });
  },
  leaveGroup: (conversationId) => {
    return axiosClient.delete(`/conversation/${conversationId}/leave`);
  },
};

export default conversationApi;
