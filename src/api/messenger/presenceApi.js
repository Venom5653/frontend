import messengerApi from "./messengerApi.js";

export const getOnlineUsers = async () => {

    const response = await messengerApi.get(
        "/api/presence/online"
    );

    return Array.isArray(response.data)
        ? response.data
        : [];
};