// =====================================================
// GET OTHER USERNAME
// =====================================================

export const getOtherUsername = (chat, currentUsername) => {

    if (!chat) {
        return null;
    }


    const user1 = chat.user1Username?.trim();

    const user2 = chat.user2Username?.trim();


    if (!currentUsername) {

        return user1 || user2 || null;

    }


    const normalizedCurrent = currentUsername
        .trim()
        .toLowerCase();


    if (user1 && user1.toLowerCase() === normalizedCurrent) {

        return user2 || null;

    }


    if (user2 && user2.toLowerCase() === normalizedCurrent) {

        return user1 || null;

    }


    return user1 || user2 || null;

};


// =====================================================
// GET OTHER AVATAR
// =====================================================

export const getOtherAvatar = (chat, currentUsername) => {

    if (!chat) {
        return null;
    }


    const user1 = chat.user1Username?.trim();

    const user2 = chat.user2Username?.trim();


    if (!currentUsername) {

        return (chat.user1Avatar || chat.user2Avatar || null);

    }


    const normalizedCurrent = currentUsername
        .trim()
        .toLowerCase();


    // =============================================
    // CURRENT USER = USER 1
    // =============================================

    if (user1 && user1.toLowerCase() === normalizedCurrent) {

        return chat.user2Avatar || null;

    }


    // =============================================
    // CURRENT USER = USER 2
    // =============================================

    if (user2 && user2.toLowerCase() === normalizedCurrent) {

        return chat.user1Avatar || null;

    }


    // =============================================
    // FALLBACK
    // =============================================

    return (chat.user1Avatar || chat.user2Avatar || null);

};


// =====================================================
// CHECK MESSAGE BELONGS TO CHAT
// =====================================================

export const messageBelongsToChat = (message, chat) => {

    if (!message || !chat) {
        return false;
    }


    // =============================================
    // CHECK BY CHAT ID
    // =============================================

    if (message.chatRoomId != null && chat.id != null) {

        return (Number(message.chatRoomId) === Number(chat.id));

    }


    if (message.chatId != null && chat.id != null) {

        return (Number(message.chatId) === Number(chat.id));

    }


    // =============================================
    // CHECK BY USERS
    // =============================================

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


    return (

        (sender === user1 && recipient === user2)

        ||

        (sender === user2 && recipient === user1)

    );

};