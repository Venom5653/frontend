import {
    useCallback, useEffect, useRef, useState
} from "react";

import messengerApi from "../../api/messenger/messengerApi.js";


function useChats(currentUsername, currentUserId) {


    // =====================================================
    // STATE
    // =====================================================

    const [chats, setChats] = useState([]);

    const [error, setError] = useState("");


    // =====================================================
    // REFS
    // =====================================================

    const chatsRef = useRef([]);


    // =====================================================
    // SYNC REF
    // =====================================================

    useEffect(() => {

        chatsRef.current = chats;

    }, [chats]);


    // =====================================================
    // NORMALIZE CHAT
    // =====================================================

    const normalizeChat = useCallback((chat, previousChat = null) => {

        if (!chat) {
            return null;
        }


        return {

            ...chat,

            // -------------------------------------------------
            // Frontend-only fields
            // -------------------------------------------------

            lastMessage: chat.lastMessage ?? previousChat?.lastMessage ?? "",

            lastMessageCreatedAt: chat.lastMessageCreatedAt ?? previousChat?.lastMessageCreatedAt ?? chat.lastMessageAt ?? null,

            unreadCount: chat.unreadCount ?? previousChat?.unreadCount ?? 0

        };

    }, []);


    // =====================================================
    // LOAD CHATS
    // =====================================================

    const loadChats = useCallback(async () => {

        if (!currentUserId) {

            console.warn("ID текущего пользователя отсутствует");

            return [];

        }


        try {

            const response = await messengerApi.get("/api/chats", {
                headers: {
                    "X-User-Id": currentUserId
                }
            });


            const chatList = Array.isArray(response.data) ? response.data : [];


            const normalizedChats = chatList.map(chat => {

                const previousChat = chatsRef.current.find(previous => Number(previous.id) === Number(chat.id));


                return normalizeChat(chat, previousChat);

            });


            // -------------------------------------------------
            // Sort by last message
            // -------------------------------------------------

            normalizedChats.sort((a, b) => {

                const dateA = new Date(a.lastMessageCreatedAt || a.lastMessageAt || a.createdAt).getTime();


                const dateB = new Date(b.lastMessageCreatedAt || b.lastMessageAt || b.createdAt).getTime();


                return dateB - dateA;

            });


            setChats(normalizedChats);

            chatsRef.current = normalizedChats;


            return normalizedChats;

        } catch (error) {

            console.error("Ошибка загрузки чатов:", error);


            setError(error.response?.data?.message || "Не удалось загрузить чаты");


            return [];

        }

    }, [currentUserId, normalizeChat]);


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        if (!currentUsername || !currentUserId) {
            return;
        }


        loadChats();

    }, [currentUsername, currentUserId, loadChats]);


    // =====================================================
    // CREATE PRIVATE CHAT REQUEST
    // =====================================================

    const createChatRequest = useCallback(async username => {

        if (!currentUserId) {

            throw new Error("ID текущего пользователя отсутствует");

        }


        const response = await messengerApi.post("/api/chats/private", {
            username
        }, {
            headers: {
                "X-User-Id": currentUserId
            }
        });


        return normalizeChat(response.data);

    }, [currentUserId, normalizeChat]);

    // =====================================================
    // CREATE GROUP CHAT REQUEST
    // =====================================================

    const createGroupRequest = useCallback(async (name, userIds) => {

        if (!currentUserId) {

            throw new Error("ID текущего пользователя отсутствует");

        }


        const response = await messengerApi.post(
            "/api/chats/group",
            {
                name,
                userIds
            },
            {
                headers: {
                    "X-User-Id": currentUserId
                }
            }
        );


        return normalizeChat(response.data);

    }, [currentUserId, normalizeChat]);

    // =====================================================
    // ADD OR UPDATE CHAT
    // =====================================================

    const addOrUpdateChat = newChat => {

        if (!newChat) {
            return;
        }


        setChats(previous => {

            const previousChat = previous.find(chat => Number(chat.id) === Number(newChat.id));


            const normalizedChat = normalizeChat(newChat, previousChat);


            const exists = Boolean(previousChat);


            const updated = exists

                ? previous.map(chat =>

                    Number(chat.id) === Number(normalizedChat.id)

                        ? normalizedChat

                        : chat)

                : [normalizedChat, ...previous];


            // -------------------------------------------------
            // Sort
            // -------------------------------------------------

            updated.sort((a, b) => {

                const dateA = new Date(a.lastMessageCreatedAt || a.lastMessageAt || a.createdAt).getTime();


                const dateB = new Date(b.lastMessageCreatedAt || b.lastMessageAt || b.createdAt).getTime();


                return dateB - dateA;

            });


            chatsRef.current = updated;


            return updated;

        });

    };


    // =====================================================
    // UPDATE CHAT AFTER MESSAGE
    // =====================================================

    const updateChatAfterMessage = (chatId, message, unreadCount) => {

        setChats(previous => {

            const updated = previous.map(chat => {

                if (Number(chat.id) !== Number(chatId)) {

                    return chat;

                }


                return {

                    ...chat,

                    lastMessage: message.content,

                    lastMessageCreatedAt: message.createdAt,

                    // Backend поле также обновляем
                    lastMessageAt: message.createdAt,

                    unreadCount

                };

            });


            // -------------------------------------------------
            // Sort by latest message
            // -------------------------------------------------

            updated.sort((a, b) => {

                const dateA = new Date(a.lastMessageCreatedAt || a.lastMessageAt || a.createdAt).getTime();


                const dateB = new Date(b.lastMessageCreatedAt || b.lastMessageAt || b.createdAt).getTime();


                return dateB - dateA;

            });


            chatsRef.current = updated;


            return updated;

        });

    };


    // =====================================================
    // MARK CHAT AS READ
    // =====================================================

    const markChatAsRead = chatId => {

        setChats(previous => {

            const updated = previous.map(chat =>

                Number(chat.id) === Number(chatId)

                    ? {
                        ...chat, unreadCount: 0
                    }

                    : chat);


            chatsRef.current = updated;


            return updated;

        });

    };

    const removeChat = chatId => {

        setChats(previous => {

            const updated =
                previous.filter(
                    chat =>
                        Number(chat.id) !==
                        Number(chatId)
                );


            chatsRef.current = updated;


            return updated;

        });

    };

    // =====================================================
    // RETURN
    // =====================================================

    return {

        chats,

        chatsRef,

        error,

        setError,

        loadChats,

        createChatRequest,

        createGroupRequest,

        addOrUpdateChat,

        updateChatAfterMessage,

        markChatAsRead,

        removeChat

    };

}


export default useChats;