import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    sendChatMessage
} from "../../services/messenger/websocketService.js";

import useGroupChat from "./useGroupChat.js";
import useCurrentUser from "./useCurrentUser.js";
import useChats from "./useChats.js";
import useChatMessages from "./useChatMessages.js";
import usePresence from "./usePresence.js";
import useMessengerWebSocket from "./useMessengerWebSocket.js";
import useNotifications from "./useNotifications.js";

import messengerApi from "../../api/messenger/messengerApi.js";

function useMessengerController() {
    const {
        currentUser,
        currentUsername,
        loadingCurrentUser
    } = useCurrentUser();

    const [selectedChat, setSelectedChat] = useState(null);

    const selectedChatRef = useRef(null);

    const [content, setContent] = useState("");

    const {
        chats,
        chatsRef,
        error: chatsError,
        setError: setChatsError,
        loadChats,
        createChatRequest,
        createGroupRequest,
        addOrUpdateChat,
        updateChatAfterMessage,
        markChatAsRead,
        removeChat
    } = useChats(
        currentUsername,
        currentUser?.id
    );

    const {
        messages,
        loadingMessages,
        loadingOlderMessages,
        error: messagesError,
        setError: setMessagesError,
        messagesContainerRef,
        selectedChatRef: messagesSelectedChatRef,
        loadChatMessages,
        handleMessagesScroll,
        addMessage,
        markMessageAsRead,
        deleteMessage,
        handleMessageDeleted,
        closeMessages
    } = useChatMessages();

    const {
        onlineUsers
    } = usePresence(currentUsername);

    const {
        notifications,
        unreadCount,
        setNotifications,
        setUnreadCount,
        deleteNotification,
        deleteNotificationByChatId,
        deleteAllNotifications
    } = useNotifications(currentUsername);

    const {
        updateGroup,
        uploadAvatar,
        deleteAvatar,
        addMember,
        removeMember,
        changeRole,
        transferOwnership,
        leaveGroup,
        deleteGroup
    } = useGroupChat({
        selectedChat,
        setSelectedChat,
        addOrUpdateChat,
        removeChat,
        currentUserId: currentUser?.id
    });

    useEffect(() => {
        selectedChatRef.current = selectedChat;
        messagesSelectedChatRef.current = selectedChat;
    }, [
        selectedChat,
        messagesSelectedChatRef
    ]);

    useMessengerWebSocket({
        currentUsername,
        chatsRef,
        selectedChatRef,
        selectedChat,
        addMessage,
        markMessageAsRead,
        handleMessageDeleted,
        updateChatAfterMessage,
        markChatAsRead,
        loadChats
    });

    const selectChat = async chat => {
        if (!chat) {
            return;
        }

        setChatsError("");
        setMessagesError("");

        setSelectedChat(chat);

        selectedChatRef.current = chat;
        messagesSelectedChatRef.current = chat;

        await loadChatMessages(chat);

        try {
            await fetchMarkChatAsRead(chat.id);
        } catch (error) {
            console.error(
                "Ошибка отметки чата прочитанным:",
                error
            );
        }

        markChatAsRead(chat.id);

        try {
            await deleteNotificationByChatId(chat.id);
        } catch (error) {
            console.error(
                "Ошибка удаления уведомления чата:",
                error
            );
        }
    };

    const openChatById = async chatId => {
        if (!chatId) {
            return;
        }

        const chat = chats.find(
            item =>
                Number(item.id) ===
                Number(chatId)
        );

        if (chat) {
            await selectChat(chat);
            return;
        }

        console.warn(
            "Чат для уведомления не найден:",
            chatId
        );

        try {
            await loadChats();
        } catch (error) {
            console.error(
                "Ошибка обновления чатов:",
                error
            );

            return;
        }

        const updatedChats =
            chatsRef.current || [];

        const updatedChat =
            updatedChats.find(
                item =>
                    Number(item.id) ===
                    Number(chatId)
            );

        if (!updatedChat) {
            console.warn(
                "Чат всё ещё не найден:",
                chatId
            );

            return;
        }

        await selectChat(updatedChat);
    };

    const fetchMarkChatAsRead = async chatId => {
        if (!chatId) {
            console.error(
                "Невозможно отметить чат прочитанным: chatId отсутствует"
            );

            return;
        }

        const url =
            `/api/messages/chat/${chatId}/read`;

        console.log(
            "MARK CHAT AS READ:",
            {
                chatId,
                url
            }
        );

        await messengerApi.put(url);
    };

    const createChat = async username => {
        const target = username?.trim();

        if (!target) {
            return;
        }

        if (
            currentUsername &&
            target.toLowerCase() ===
            currentUsername.toLowerCase()
        ) {
            setChatsError(
                "Нельзя создать чат с самим собой"
            );

            return;
        }

        try {
            setChatsError("");

            const newChat =
                await createChatRequest(target);

            addOrUpdateChat(newChat);

            await selectChat(newChat);
        } catch (error) {
            console.error(
                "Ошибка создания чата:",
                error
            );

            setChatsError(
                error.response?.data?.message ||
                "Не удалось создать чат"
            );
        }
    };

    const createGroup = async (name, userIds) => {
        const groupName = name?.trim();

        if (!groupName) {
            return;
        }

        if (
            !Array.isArray(userIds) ||
            userIds.length === 0
        ) {
            setChatsError(
                "Добавьте хотя бы одного участника"
            );

            return;
        }

        try {
            setChatsError("");

            const newGroup =
                await createGroupRequest(
                    groupName,
                    userIds
                );

            addOrUpdateChat(newGroup);

            await selectChat(newGroup);

            return true;
        } catch (error) {
            console.error(
                "Ошибка создания группы:",
                error
            );

            setChatsError(
                error.response?.data?.message ||
                "Не удалось создать группу"
            );

            return false;
        }
    };

    const closeChat = () => {
        setSelectedChat(null);

        selectedChatRef.current = null;

        messagesSelectedChatRef.current = null;

        setContent("");

        closeMessages();
    };

    const sendMessage = () => {
        const text = content.trim();

        if (!text || !selectedChat) {
            return;
        }

        const success =
            sendChatMessage(
                selectedChat.id,
                text
            );

        if (!success) {
            setMessagesError(
                "WebSocket не подключен"
            );

            return;
        }

        setContent("");
        setMessagesError("");
    };

    const error =
        messagesError || chatsError;

    return {
        currentUser,
        currentUsername,
        loadingCurrentUser,
        chats,
        selectedChat,
        messages,
        loadingMessages,
        loadingOlderMessages,
        content,
        setContent,
        onlineUsers,
        notifications,
        unreadCount,
        setNotifications,
        setUnreadCount,
        deleteNotification,
        deleteNotificationByChatId,
        deleteAllNotifications,
        error,
        messagesContainerRef,
        selectChat,
        openChatById,
        createChat,
        createGroup,
        closeChat,
        sendMessage,
        handleMessagesScroll,
        deleteMessage,
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

export default useMessengerController;