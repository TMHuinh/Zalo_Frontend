import axiosClient from "./axiosClient";

const conversationApi = {
    getByUserId: () => {
        return axiosClient.get("/conversation/getByUserId");
    },
};

export default conversationApi;