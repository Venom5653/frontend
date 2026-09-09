import messengerApi from "./messengerApi.js";


export const searchUser = async username => {

    const response = await messengerApi.get("/api/users/search", {
        params: {
            username
        }
    });

    return response.data;

};


export const getGroupChat = async (chatId, currentUserId) => {

    const response = await messengerApi.get(`/api/chats/${chatId}`, {
        headers: {
            "X-User-Id": currentUserId
        }
    });

    return response.data;

};


export const addGroupMember = async (chatId, userId, currentUserId) => {

    const response = await messengerApi.post(`/api/chats/${chatId}/members`, {
        userId
    }, {
        headers: {
            "X-User-Id": currentUserId
        }
    });

    return response.data;

};


export const removeGroupMember = async (chatId, userId, currentUserId) => {

    const response = await messengerApi.delete(`/api/chats/${chatId}/members/${userId}`, {
        headers: {
            "X-User-Id": currentUserId
        }
    });

    return response.data;

};


export const leaveGroup = async (chatId, currentUserId) => {

    const response = await messengerApi.delete(`/api/chats/${chatId}/members/me`, {
        headers: {
            "X-User-Id": currentUserId
        }
    });

    return response.data;

};


export const changeGroupMemberRole = async (chatId, userId, role, currentUserId) => {

    const response = await messengerApi.put(`/api/chats/${chatId}/members/${userId}/role`, {
        role
    }, {
        headers: {
            "X-User-Id": currentUserId
        }
    });

    return response.data;

};


export const transferGroupOwnership = async (chatId, userId, currentUserId) => {

    console.log("TRANSFER OWNERSHIP:", {
        chatId,
        userId,
        currentUserId
    });

    const response = await messengerApi.put(`/api/chats/${chatId}/members/owner/${userId}`, null, {
        headers: {
            "X-User-Id": currentUserId
        }
    });

    return response.data;

};


export const deleteGroup = async (chatId, currentUserId) => {

    const response = await messengerApi.delete(`/api/chats/${chatId}`, {
        headers: {
            "X-User-Id": currentUserId
        }
    });

    return response.data;

};


export const updateGroup = async (chatId, name, currentUserId) => {

    const response = await messengerApi.put(`/api/chats/${chatId}`, {
        name
    }, {
        headers: {
            "X-User-Id": currentUserId
        }
    });

    return response.data;

};


export const uploadGroupAvatar = async (chatId, file, currentUserId) => {

    const formData = new FormData();

    formData.append("file", file);

    const response = await messengerApi.post(`/api/chats/${chatId}/avatar`, formData, {
        headers: {
            "X-User-Id": currentUserId
        }
    });

    return response.data;

};


export const deleteGroupAvatar = async (chatId, currentUserId) => {

    const response = await messengerApi.delete(`/api/chats/${chatId}/avatar`, {
        headers: {
            "X-User-Id": currentUserId
        }
    });

    return response.data;

};