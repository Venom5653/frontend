import {
    useCallback, useEffect, useRef, useState
} from "react";

import messengerApi from "../../api/messenger/messengerApi.js";


function useChats(currentUsername) {


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
// LOAD CHATS
// =====================================================

    const loadChats = useCallback(async () => {

        try {

            const response = await messengerApi.get("/api/chats");


            const chatList = Array.isArray(response.data) ? response.data : [];


            setChats(chatList);

            chatsRef.current = chatList;


            return chatList;

        } catch (error) {

            console.error("Ошибка загрузки чатов:", error);


            setError(error.response?.data?.message || "Не удалось загрузить чаты");


            return [];

        }

    }, []);


// =====================================================
// INITIAL LOAD
// =====================================================

    useEffect(() => {

        if (!currentUsername) {
            return;
        }


        loadChats();

    }, [currentUsername, loadChats]);


// =====================================================
// CREATE CHAT REQUEST
// =====================================================

    const createChatRequest = async username => {

        const response = await messengerApi.post("/api/chats", {
            username
        });


        return response.data;

    };


// =====================================================
// ADD OR UPDATE CHAT
// =====================================================

    const addOrUpdateChat = newChat => {

        setChats(previous => {

            const exists = previous.some(chat => chat.id === newChat.id);


            const updated = exists

                ? previous.map(chat =>

                    chat.id === newChat.id

                        ? newChat

                        : chat)

                : [

                    newChat,

                    ...previous

                ];


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

                    unreadCount

                };

            });


            updated.sort((a, b) =>

                new Date(b.lastMessageCreatedAt || b.createdAt)

                -

                new Date(a.lastMessageCreatedAt || a.createdAt));


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

                        ...chat,

                        unreadCount: 0

                    }

                    : chat);


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

        addOrUpdateChat,

        updateChatAfterMessage,

        markChatAsRead

    };

}


export default useChats;