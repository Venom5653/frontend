import {
    useEffect, useRef, useState
} from "react";

import {
    sendChatMessage
} from "../../services/messenger/websocketService.js";

import useCurrentUser from "./useCurrentUser.js";
import useChats from "./useChats.js";
import useChatMessages from "./useChatMessages.js";
import usePresence from "./usePresence.js";
import useMessengerWebSocket from "./useMessengerWebSocket.js";
import useNotifications from "./useNotifications.js";

import {
    getOtherUsername
} from "../../utils/chatUtils.js";

import messengerApi from "../../api/messenger/messengerApi.js";



function useMessengerController() {

    const {
        currentUser, currentUsername, loadingCurrentUser
    } = useCurrentUser();


    const [selectedChat, setSelectedChat] = useState(null);


    const selectedChatRef = useRef(null);


    const [content, setContent] = useState("");


    /*
     * ============================
     * CHATS
     * ============================
     */

    const {
        chats,
        chatsRef,
        error: chatsError,
        setError: setChatsError,
        loadChats,
        createChatRequest,
        addOrUpdateChat,
        updateChatAfterMessage,
        markChatAsRead
    } = useChats(currentUsername);


    /*
     * ============================
     * MESSAGES
     * ============================
     */

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
        closeMessages
    } = useChatMessages();


    /*
     * ============================
     * PRESENCE
     * ============================
     */

    const {
        onlineUsers
    } = usePresence(currentUsername);


    /*
     * ============================
     * NOTIFICATIONS
     * ============================
     */

    const {
        notifications,
        unreadCount,
        setNotifications,
        setUnreadCount,
        deleteNotification,
        deleteNotificationByChatId,
        deleteAllNotifications
    } = useNotifications(currentUsername);


    /*
     * ============================
     * SELECTED CHAT REFS
     * ============================
     */

    useEffect(() => {

        selectedChatRef.current = selectedChat;


        messagesSelectedChatRef.current = selectedChat;

    }, [selectedChat, messagesSelectedChatRef]);


    /*
     * ============================
     * MESSENGER WEBSOCKET
     * ============================
     */

    useMessengerWebSocket({
        currentUsername,
        chatsRef,
        selectedChatRef,
        selectedChat,
        addMessage,
        markMessageAsRead,
        updateChatAfterMessage,
        markChatAsRead,
        loadChats
    });


    /*
     * ============================
     * SELECT CHAT
     * ============================
     */

    const selectChat = async chat => {

        if (!chat) {
            return;
        }


        setChatsError("");

        setMessagesError("");


        setSelectedChat(chat);


        selectedChatRef.current = chat;


        messagesSelectedChatRef.current = chat;


        /*
         * Загружаем сообщения.
         */
        await loadChatMessages(chat);


        /*
         * Отмечаем сообщения чата
         * прочитанными на backend.
         */
        try {

            await fetchMarkChatAsRead(chat.id);

        } catch (error) {

            console.error("Ошибка отметки чата прочитанным:", error);
        }


        /*
         * Обновляем состояние чатов.
         */
        markChatAsRead(chat.id);


        /*
         * ========================================
         * УДАЛЯЕМ УВЕДОМЛЕНИЕ ЭТОГО ЧАТА
         * ========================================
         *
         * Теперь неважно, как пользователь
         * попал в чат:
         *
         * - нажал на уведомление;
         * - нажал на чат в списке;
         * - открыл чат другим способом.
         *
         * Уведомление этого чата исчезает.
         */
        try {

            await deleteNotificationByChatId(chat.id);

        } catch (error) {

            console.error("Ошибка удаления уведомления чата:", error);
        }
    };


    /*
     * ============================
     * OPEN CHAT BY ID
     * ============================
     */

    const openChatById = async chatId => {

        if (!chatId) {
            return;
        }


        const chat = chats.find(item => Number(item.id) === Number(chatId));


        /*
         * Чат уже есть в списке.
         */
        if (chat) {

            await selectChat(chat);

            return;
        }


        /*
         * Чат не найден.
         *
         * Обновляем список.
         */
        console.warn("Чат для уведомления не найден:", chatId);


        try {

            await loadChats();

        } catch (error) {

            console.error("Ошибка обновления чатов:", error);

            return;
        }


        const updatedChats = chatsRef.current || [];


        const updatedChat = updatedChats.find(item => Number(item.id) === Number(chatId));


        if (!updatedChat) {

            console.warn("Чат всё ещё не найден:", chatId);

            return;
        }


        await selectChat(updatedChat);
    };


    const fetchMarkChatAsRead = async (chatId) => {
        if (!chatId) {
            console.error("Невозможно отметить чат прочитанным: chatId отсутствует");
            return;
        }

        const url = `/api/messages/chat/${chatId}/read`;

        console.log("MARK CHAT AS READ:", {
            chatId, url
        });

        await messengerApi.put(url);
    };

    const createChat = async username => {

        const target = username?.trim();


        if (!target) {
            return;
        }


        if (currentUsername && target.toLowerCase() === currentUsername.toLowerCase()) {

            setChatsError("Нельзя создать чат с самим собой");

            return;
        }


        try {

            setChatsError("");


            const newChat = await createChatRequest(target);


            addOrUpdateChat(newChat);


            await selectChat(newChat);

        } catch (error) {

            console.error("Ошибка создания чата:", error);


            setChatsError(error.response?.data?.message || "Не удалось создать чат");
        }
    };


    /*
     * ============================
     * CLOSE CHAT
     * ============================
     */

    const closeChat = () => {

        setSelectedChat(null);


        selectedChatRef.current = null;


        messagesSelectedChatRef.current = null;


        setContent("");


        closeMessages();
    };


    /*
     * ============================
     * SEND MESSAGE
     * ============================
     */

    const sendMessage = () => {

        const text = content.trim();


        if (!text || !selectedChat) {

            return;
        }


        const recipient = getOtherUsername(selectedChat, currentUsername);


        if (!recipient) {

            setMessagesError("Не удалось определить получателя");

            return;
        }


        const success = sendChatMessage(recipient, text);


        if (!success) {

            setMessagesError("WebSocket не подключен");

            return;
        }


        setContent("");

        setMessagesError("");
    };


    /*
     * ============================
     * ERROR
     * ============================
     */

    const error = messagesError || chatsError;


    /*
     * ============================
     * RETURN
     * ============================
     */

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

        closeChat,

        sendMessage,

        handleMessagesScroll
    };
}


export default useMessengerController;