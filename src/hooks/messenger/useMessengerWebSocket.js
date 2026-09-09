import {
    useEffect
} from "react";

import messengerApi from "../../api/messenger/messengerApi.js";

import {
    messageBelongsToChat
} from "../../utils/chatUtils.js";

import {
    connectWebSocket,
    disconnectWebSocket,
    subscribeToMessages,
    subscribeToReadEvents,
    openChat,
    closeChat as closeActiveChat
} from "../../services/messenger/websocketService.js";


function useMessengerWebSocket({

                                   currentUsername,

                                   chatsRef,

                                   selectedChatRef,

                                   selectedChat,

                                   addMessage,

                                   markMessageAsRead,

                                   updateChatAfterMessage,

                                   markChatAsRead,

                                   loadChats

                               }) {


    // =====================================================
    // MESSAGE HANDLER
    // =====================================================

    useEffect(() => {

        if (!currentUsername) {
            return;
        }


        const messageHandler = async message => {

            if (!message) {
                return;
            }


            const currentChats =
                chatsRef.current || [];


            const currentChat =
                selectedChatRef.current;


            // =============================================
            // MESSAGE CHAT
            // =============================================

            const messageChat =
                currentChats.find(chat =>
                    messageBelongsToChat(
                        message,
                        chat
                    )
                );


            // =============================================
            // CURRENT CHAT
            // =============================================

            const isCurrentChat =
                Boolean(
                    currentChat &&
                    messageBelongsToChat(
                        message,
                        currentChat
                    )
                );


            // =============================================
            // OWN MESSAGE
            // =============================================

            const isOwn =
                Boolean(
                    message.senderUsername &&
                    currentUsername &&
                    message.senderUsername
                        .trim()
                        .toLowerCase() ===
                    currentUsername
                        .trim()
                        .toLowerCase()
                );


            // =============================================
            // CHAT ID
            // =============================================

            const chatId =
                message.chatId;


            if (!chatId) {

                console.warn(
                    "Получено сообщение без chatId:",
                    message
                );

                return;
            }


            // =============================================
            // CURRENT CHAT
            // =============================================

            if (isCurrentChat) {

                addMessage(message);


                // -----------------------------------------
                // НЕ ОТМЕЧАЕМ СВОЁ СООБЩЕНИЕ КАК ПРОЧИТАННОЕ
                // -----------------------------------------

                if (!isOwn) {

                    try {

                        await messengerApi.put(
                            `/api/messages/chat/${chatId}/read`
                        );


                        markChatAsRead(chatId);

                    } catch (error) {

                        console.error(
                            "Ошибка отметки сообщений прочитанными:",
                            error
                        );

                    }

                }

            }


            // =============================================
            // CHAT LIST
            // =============================================

            if (messageChat) {

                const unread =
                    Number(
                        messageChat.unreadCount || 0
                    );


                const nextUnread =
                    isCurrentChat || isOwn
                        ? 0
                        : unread + 1;


                updateChatAfterMessage(
                    messageChat.id,
                    message,
                    nextUnread
                );

            } else {

                await loadChats();

            }

        };


        // =================================================
        // READ HANDLER
        // =================================================

        const readHandler = event => {

            console.log(
                "MESSAGE READ EVENT:",
                event
            );


            if (!event?.messageId) {
                return;
            }


            // event.messageId =
            // последний прочитанный message ID

            markMessageAsRead(
                event.messageId
            );

        };


        // =================================================
        // REGISTER HANDLERS
        // =================================================

        subscribeToMessages(messageHandler);

        subscribeToReadEvents(readHandler);


        // =================================================
        // CONNECT
        // =================================================

        const token =
            localStorage.getItem("token");


        if (!token) {

            console.warn(
                "JWT token отсутствует"
            );

            return;

        }


        connectWebSocket(token, () => {

            if (selectedChatRef.current?.id) {

                openChat(
                    selectedChatRef.current.id
                );

            }

        });


        // =================================================
        // CLEANUP
        // =================================================

        return () => {

            closeActiveChat();

            disconnectWebSocket();

        };

    }, [currentUsername]);


    // =====================================================
    // ACTIVE CHAT
    // =====================================================

    useEffect(() => {

        if (!selectedChat?.id) {

            closeActiveChat();

            return;

        }


        openChat(
            selectedChat.id
        );


        return () => {

            closeActiveChat();

        };

    }, [selectedChat?.id]);

}


export default useMessengerWebSocket;