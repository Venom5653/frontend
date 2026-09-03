import {
    subscribeToUserStatus
} from "./websocketService.js";

const normalizeUsername = username => {

    if (!username) {
        return null;
    }

    return username
        .trim()
        .toLowerCase();
};

export const createOnlineUsersSet = (usernames = []) => {

    return new Set(usernames
        .map(normalizeUsername)
        .filter(Boolean));
};

export const isUserOnline = (onlineUsers, username) => {

    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername) {
        return false;
    }

    return onlineUsers.has(normalizedUsername);
};

export const subscribeToPresence = (onStatusChange) => {

    return subscribeToUserStatus(event => {

        if (!event || !event.username) {
            return;
        }

        onStatusChange({
            username: event.username, online: Boolean(event.online)
        });
    });
};