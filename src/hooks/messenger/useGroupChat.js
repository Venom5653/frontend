import {
    useCallback
} from "react";

import {
    updateGroup as updateGroupRequest,
    uploadGroupAvatar,
    deleteGroupAvatar,
    getGroupChat,
    addGroupMember,
    removeGroupMember,
    changeGroupMemberRole,
    transferGroupOwnership,
    leaveGroup as leaveGroupRequest,
    deleteGroup as deleteGroupRequest
} from "../../api/messenger/groupChatApi.js";


function useGroupChat({
                          selectedChat, setSelectedChat, addOrUpdateChat, removeChat, currentUserId
                      }) {

    const refreshGroup = useCallback(async chatId => {

        if (!chatId || !currentUserId) {
            return null;
        }

        const updatedChat = await getGroupChat(chatId, currentUserId);

        addOrUpdateChat(updatedChat);

        setSelectedChat(updatedChat);

        return updatedChat;

    }, [currentUserId, addOrUpdateChat, setSelectedChat]);


    const updateGroup = async name => {

        if (!selectedChat?.id) {
            return null;
        }

        const updatedChat = await updateGroupRequest(
            selectedChat.id,
            name,
            currentUserId
        );

        addOrUpdateChat(updatedChat);

        setSelectedChat(updatedChat);

        return updatedChat;

    };


    const uploadAvatar = async file => {

        if (!selectedChat?.id) {
            return null;
        }

        const updatedChat = await uploadGroupAvatar(
            selectedChat.id,
            file,
            currentUserId
        );

        addOrUpdateChat(updatedChat);

        setSelectedChat(updatedChat);

        return updatedChat;

    };


    const deleteAvatar = async () => {

        if (!selectedChat?.id) {
            return null;
        }

        const updatedChat = await deleteGroupAvatar(
            selectedChat.id,
            currentUserId
        );

        addOrUpdateChat(updatedChat);

        setSelectedChat(updatedChat);

        return updatedChat;

    };


    const addMember = async userId => {

        if (!selectedChat?.id) {
            return null;
        }

        const result = await addGroupMember(
            selectedChat.id,
            userId,
            currentUserId
        );

        await refreshGroup(selectedChat.id);

        return result;

    };


    const removeMember = async userId => {

        if (!selectedChat?.id) {
            return;
        }

        const chatId = selectedChat.id;

        await removeGroupMember(
            selectedChat.id,
            userId,
            currentUserId
        );

        await refreshGroup(chatId);

    };


    const changeRole = async (userId, role) => {

        if (!selectedChat?.id) {
            return null;
        }

        const chatId = selectedChat.id;

        const result = await changeGroupMemberRole(
            selectedChat.id,
            userId,
            role,
            currentUserId
        );

        await refreshGroup(chatId);

        return result;

    };


    const transferOwnership = async userId => {

        if (!selectedChat?.id) {
            return;
        }

        const chatId = selectedChat.id;

        await transferGroupOwnership(
            selectedChat.id,
            userId,
            currentUserId
        );

        await refreshGroup(chatId);

    };


    const leaveGroup = async () => {

        if (!selectedChat?.id) {
            return;
        }

        const chatId = selectedChat.id;

        await leaveGroupRequest(
            chatId,
            currentUserId
        );

        removeChat(chatId);

        setSelectedChat(null);

    };


    const deleteGroup = async () => {

        if (!selectedChat?.id) {
            return;
        }

        const chatId = selectedChat.id;

        await deleteGroupRequest(
            chatId,
            currentUserId
        );

        removeChat(chatId);

        setSelectedChat(null);

    };


    return {

        updateGroup,

        uploadAvatar,

        deleteAvatar,

        addMember,

        removeMember,

        changeRole,

        transferOwnership,

        leaveGroup,

        deleteGroup

    };

}


export default useGroupChat;