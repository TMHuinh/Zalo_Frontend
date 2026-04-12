import axiosClient from "./axiosClient";



const messageApi = {
    getMessages: (conversationId, page = 1, limit = 20) => {
        return axiosClient.get(
            `/message/conversation/${conversationId}?page=${page}`
        );
    },

    sendMessage: (formData) => {
        return axiosClient.post("/message/send", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },
    revokeMessage: (messageId) =>
        axiosClient.delete("/message/revoke", {
            data: { messageId },
        }),

    deleteMessage: (messageId) =>
        axiosClient.delete("/message/delete", {
            data: { messageId },
        }),
};
export default messageApi;