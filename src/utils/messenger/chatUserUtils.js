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


    if (user1 && user1.toLowerCase() === normalizedCurrent) {

        return chat.user2Avatar || null;

    }


    if (user2 && user2.toLowerCase() === normalizedCurrent) {

        return chat.user1Avatar || null;

    }


    return (chat.user1Avatar || chat.user2Avatar || null);

};