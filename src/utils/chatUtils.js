export const getOtherMember = (chat, currentUsername) => {

    if (!chat?.members?.length) {
        return null;
    }

    const normalizedCurrent = currentUsername
        ?.trim()
        .toLowerCase();

    if (!normalizedCurrent) {
        return chat.members[0] || null;
    }

    return chat.members.find(member => member?.username
        ?.trim()
        .toLowerCase() !== normalizedCurrent) || null;
};

export const getOtherUsername = (chat, currentUsername) => {

    if (!chat) {
        return null;
    }

    if (chat.type === "GROUP") {
        return chat.name?.trim() || "Группа";
    }

    const otherMember = getOtherMember(chat, currentUsername);

    return otherMember?.username?.trim() || null;
};

export const getOtherAvatar = (chat, currentUsername) => {

    if (!chat) {
        return null;
    }

    if (chat.type === "GROUP") {
        return chat.avatar || null;
    }

    const otherMember = getOtherMember(chat, currentUsername);

    return otherMember?.avatar || null;
};

export const getChatDisplayName = (chat, currentUsername) => {

    if (!chat) {
        return "";
    }

    if (chat.type === "GROUP") {
        return chat.name?.trim() || "Группа";
    }

    return getOtherUsername(chat, currentUsername) || "Неизвестный пользователь";
};

export const getChatAvatar = (chat, currentUsername) => {

    if (!chat) {
        return null;
    }

    if (chat.type === "GROUP") {
        return chat.avatar || null;
    }

    return getOtherAvatar(chat, currentUsername);
};

export const messageBelongsToChat = (message, chat) => {

    if (!message || !chat) {
        return false;
    }

    if (message.chatId == null || chat.id == null) {
        return false;
    }

    return Number(message.chatId) === Number(chat.id);
};

export const formatTime = date => {

    if (!date) {
        return "";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    return parsed.toLocaleTimeString("ru-RU", {
        hour: "2-digit", minute: "2-digit"
    });
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const getAvatarUrl = avatar => {

    if (!avatar || typeof avatar !== "string") {
        return null;
    }

    const value = avatar.trim();

    if (!value) {
        return null;
    }

    if (value.startsWith("http://") || value.startsWith("https://")) {
        return value;
    }

    if (value.startsWith("/")) {
        return `${API_URL}${value}`;
    }

    return `${API_URL}/${value}`;
};

export const getAvatarLetter = username => {

    if (!username) {
        return "?";
    }

    return username
        .trim()
        .charAt(0)
        .toUpperCase();
};