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
    subscribeToDeletedEvents,
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
                                   handleMessageDeleted,
                                   updateChatAfterMessage,
                                   markChatAsRead,
                                   loadChats
                               }) {
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

            const messageChat =
                currentChats.find(
                    chat =>
                        messageBelongsToChat(
                            message,
                            chat
                        )
                );

            const isCurrentChat =
                Boolean(
                    currentChat &&
                    messageBelongsToChat(
                        message,
                        currentChat
                    )
                );

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

            const chatId =
                message.chatId;

            if (!chatId) {
                console.warn(
                    "Получено сообщение без chatId:",
                    message
                );

                return;
            }

            if (isCurrentChat) {
                addMessage(message);

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

        const readHandler = event => {
            console.log(
                "MESSAGE READ EVENT:",
                event
            );

            if (!event?.messageId) {
                return;
            }

            markMessageAsRead(
                event.messageId
            );
        };

        const deletedHandler = event => {
            console.log(
                "MESSAGE DELETED EVENT:",
                event
            );

            if (!event?.messageId) {
                return;
            }

            handleMessageDeleted(
                event.messageId,
                event.chatId
            );
        };

        subscribeToMessages(
            messageHandler
        );

        subscribeToReadEvents(
            readHandler
        );

        subscribeToDeletedEvents(
            deletedHandler
        );

        const token =
            localStorage.getItem("token");

        if (!token) {
            console.warn(
                "JWT token отсутствует"
            );

            return;
        }

        connectWebSocket(
            token,
            () => {
                if (
                    selectedChatRef
                        .current?.id
                ) {
                    openChat(
                        selectedChatRef
                            .current.id
                    );
                }
            }
        );

        return () => {
            closeActiveChat();
            disconnectWebSocket();
        };
    }, [currentUsername]);

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