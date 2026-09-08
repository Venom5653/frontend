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
// WEBSOCKET CONNECTION
// =====================================================

    useEffect(() => {

        if (!currentUsername) {
            return;
        }


        const token = localStorage.getItem("token");


        if (!token) {

            console.warn("JWT token отсутствует");

            return;

        }


        connectWebSocket(token, async () => {


            // =====================================
            // RESTORE ACTIVE CHAT AFTER CONNECTION
            // =====================================

            if (selectedChatRef.current?.id) {

                openChat(selectedChatRef.current.id);

            }


            // =====================================
            // NEW MESSAGE
            // =====================================

            subscribeToMessages(async message => {

                const currentChats = chatsRef.current;


                const currentChat = selectedChatRef.current;


                const messageChat = currentChats.find(chat => messageBelongsToChat(message, chat));


                const isCurrentChat = currentChat && messageBelongsToChat(message, currentChat);


                const isOwn = message.senderUsername && currentUsername && message.senderUsername
                    .toLowerCase() === currentUsername
                    .toLowerCase();


                // =============================
                // CURRENT CHAT
                // =============================

                if (isCurrentChat) {

                    addMessage(message);


                    const chatId = message.chatId || message.chatRoomId || currentChat.id;


                    try {

                        await messengerApi.put(`/api/messages/chat/${chatId}/read`);


                        markChatAsRead(chatId);

                    } catch (error) {

                        console.error("Ошибка отметки сообщений прочитанными:", error);

                    }

                }


                // =============================
                // CHAT LIST
                // =============================

                if (messageChat) {

                    const unread = Number(messageChat.unreadCount || 0);


                    updateChatAfterMessage(messageChat.id, message, isCurrentChat || isOwn ? 0 : unread + 1);

                } else {

                    await loadChats();

                }

            });


            // =====================================
            // READ EVENTS
            // =====================================

            subscribeToReadEvents(event => {

                markMessageAsRead(event.messageId);

            });

        });


        // =====================================
        // CLEANUP CONNECTION
        // =====================================

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


        openChat(selectedChat.id);


        return () => {

            closeActiveChat();

        };

    }, [selectedChat?.id]);

}


export default useMessengerWebSocket;