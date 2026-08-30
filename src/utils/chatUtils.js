export const getOtherUsername = (chat, currentUsername) => {

    if (!chat) {

        console.error("getOtherUsername: chat отсутствует");

        return null;
    }


    if (!currentUsername) {

        console.error("getOtherUsername: currentUsername отсутствует");

        return null;
    }


    const user1Username = chat.user1Username;

    const user2Username = chat.user2Username;

    if (user1Username && user1Username === currentUsername) {

        return user2Username || null;
    }


    // =========================================
    // CURRENT USER = USER 2
    // =========================================

    if (user2Username && user2Username === currentUsername) {

        return user1Username || null;
    }


    // =========================================
    // FALLBACK
    // =========================================

    console.error("Не удалось определить собеседника", {
        currentUsername, user1Username, user2Username, chat
    });


    return null;
};


export const messageBelongsToChat = (message, chat) => {

    if (!message || !chat) {
        return false;
    }

    if (message.chatRoomId != null && chat.id != null) {

        return (Number(message.chatRoomId) === Number(chat.id));
    }

    if (message.chatId != null && chat.id != null) {

        return (Number(message.chatId) === Number(chat.id));
    }

    const sender = message.senderUsername;

    const recipient = message.recipientUsername;


    if (!sender || !recipient) {
        return false;
    }


    const user1 = chat.user1Username;

    const user2 = chat.user2Username;


    if (!user1 || !user2) {
        return false;
    }


    return ((sender === user1 && recipient === user2) || (sender === user2 && recipient === user1));
};