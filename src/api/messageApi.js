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
    sendChatbotMessage: (data) => {
        return axiosClient.post("/message/chatbot", data);
    },
    summarizeConversation: (messages) => {
        return axiosClient.post("/message/conversation/summary", messages);
    },
    revokeMessage: (messageId) =>
        axiosClient.delete("/message/revoke", {
            data: { messageId },
        }),

    deleteMessage: (messageId) =>
        axiosClient.delete("/message/delete", {
            data: { messageId },
        }),
    reactMessage: (data) => {
        return axiosClient.post("/message/reaction", data);
    },

    searchMessages: (conversationId, keyword, page = 1) => {
        return axiosClient.get(
            `/message/${conversationId}/search?keyword=${encodeURIComponent(keyword)}&page=${page}`,
        );
    },

    getConversationMedia: (conversationId, page = 1) => {
        return axiosClient.get(
            `/message/${conversationId}/media?page=${page}`,
        );
    },
};
export default messageApi;
