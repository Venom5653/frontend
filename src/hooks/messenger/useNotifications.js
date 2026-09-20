import {
    useCallback, useEffect, useRef, useState
} from "react";

import {
    connectNotificationWebSocket, disconnectNotificationWebSocket
} from "../../services/messenger/websocketService.js";

import messengerApi from "../../api/messenger/messengerApi.js";

function useNotifications(currentUsername) {

    const [notifications, setNotifications] = useState([]);

    const [unreadCount, setUnreadCount] = useState(0);

    const notificationsRef = useRef([]);

    const processedNotificationIds = useRef(new Set());

    const deletedNotificationIds = useRef(new Set());

    const updateNotifications = useCallback(updater => {

        setNotifications(previous => {

            const next = typeof updater === "function" ? updater(previous) : updater;

            notificationsRef.current = next;

            return next;
        });

    }, []);

    const loadNotifications = useCallback(async () => {

        if (!currentUsername) {
            return;
        }

        try {

            const response = await messengerApi.get("/api/notifications");

            console.log("========================================");
            console.log("NOTIFICATIONS HTTP STATUS:", response.status);
            console.log("NOTIFICATIONS FROM BACKEND:", response.data);
            console.log("CURRENT USERNAME:", currentUsername);
            console.log("========================================");

            const loaded = Array.isArray(response.data) ? response.data : [];

            const filtered = loaded.filter(notification => !deletedNotificationIds.current.has(notification.id));

            filtered.forEach(notification => {

                if (notification.id != null) {

                    processedNotificationIds.current.add(notification.id);
                }

            });

            const map = new Map();

            filtered.forEach(notification => {

                const key = `${notification.senderUsername}_${notification.chatId}`;

                map.set(key, notification);

            });

            const result = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            updateNotifications(result);

            setUnreadCount(result.filter(notification => !notification.read).length);

            console.log("Уведомления загружены:", result);

        } catch (error) {

            console.error("========================================");
            console.error("ОШИБКА ЗАГРУЗКИ УВЕДОМЛЕНИЙ:", error);
            console.error("HTTP STATUS:", error.response?.status);
            console.error("RESPONSE DATA:", error.response?.data);
            console.error("========================================");
        }

    }, [currentUsername, updateNotifications]);

    const handleNewNotification = useCallback(notification => {

        console.log("NOTIFICATION FROM WS:", notification);

        if (!notification) {
            return;
        }

        const notificationId = notification.id;

        const senderUsername = notification.senderUsername;

        const chatId = notification.chatId;

        if (!senderUsername || chatId == null) {
            return;
        }

        if (notificationId != null && deletedNotificationIds.current.has(notificationId)) {
            return;
        }

        const existingById = notificationsRef.current.find(item => item.id === notificationId);

        if (existingById && existingById.messageId === notification.messageId) {
            return;
        }

        if (notificationId != null) {

            processedNotificationIds.current.add(notificationId);
        }

        updateNotifications(previous => {

            const index = previous.findIndex(item => item.senderUsername === senderUsername && Number(item.chatId) === Number(chatId));

            let updated;

            if (index === -1) {

                updated = [notification, ...previous];

            } else {

                updated = [...previous];

                updated[index] = notification;
            }

            updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const unread = updated.filter(item => !item.read).length;

            setUnreadCount(unread);

            return updated;
        });

        playNotificationSound();

        console.log("NEW / UPDATED NOTIFICATION:", notification);

    }, [updateNotifications]);

    const deleteNotification = useCallback(async notificationId => {

        if (!notificationId) {
            return false;
        }

        try {

            await messengerApi.delete(`/api/notifications/${notificationId}`);

            deletedNotificationIds.current.add(notificationId);

            processedNotificationIds.current.delete(notificationId);

            updateNotifications(previous => {

                const updated = previous.filter(item => item.id !== notificationId);

                setUnreadCount(updated.filter(item => !item.read).length);

                return updated;
            });

            console.log("Уведомление удалено:", notificationId);

            return true;

        } catch (error) {

            console.error("Ошибка удаления уведомления:", error);

            return false;
        }

    }, [updateNotifications]);

    const deleteNotificationByChatId = useCallback(async chatId => {

        if (!chatId) {
            return false;
        }

        const notification = notificationsRef.current.find(item => Number(item.chatId) === Number(chatId));

        if (!notification) {
            return false;
        }

        return await deleteNotification(notification.id);
    }, [deleteNotification]);

    const deleteAllNotifications = useCallback(async () => {

        try {

            await messengerApi.delete("/api/notifications");

            notificationsRef.current.forEach(notification => {

                if (notification.id != null) {

                    deletedNotificationIds.current.add(notification.id);
                }

            });

            processedNotificationIds.current.clear();

            notificationsRef.current = [];

            updateNotifications([]);

            setUnreadCount(0);

            console.log("Все уведомления удалены");

            return true;

        } catch (error) {

            console.error("Ошибка удаления всех уведомлений:", error);

            return false;
        }

    }, [updateNotifications]);

    useEffect(() => {

        if (!currentUsername) {
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        connectNotificationWebSocket(token, handleNewNotification);

        return () => {

            disconnectNotificationWebSocket();

        };

    }, [currentUsername, handleNewNotification]);

    useEffect(() => {

        if (!currentUsername) {
            return;
        }

        loadNotifications();

    }, [currentUsername, loadNotifications]);

    return {
        notifications,
        unreadCount,
        setNotifications,
        setUnreadCount,
        deleteNotification,
        deleteNotificationByChatId,
        deleteAllNotifications
    };
}

function playNotificationSound() {

    try {

        const AudioContext = window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) {
            return;
        }

        const audioContext = new AudioContext();

        if (audioContext.state === "suspended") {

            audioContext.close();

            return;
        }

        const now = audioContext.currentTime;

        const oscillator1 = audioContext.createOscillator();

        const gainNode1 = audioContext.createGain();

        oscillator1.type = "sine";

        oscillator1.frequency.setValueAtTime(784, now);

        gainNode1.gain.setValueAtTime(0.001, now);

        gainNode1.gain.exponentialRampToValueAtTime(0.18, now + 0.015);

        gainNode1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        oscillator1.connect(gainNode1);

        gainNode1.connect(audioContext.destination);

        oscillator1.start(now);

        oscillator1.stop(now + 0.17);

        const oscillator2 = audioContext.createOscillator();

        const gainNode2 = audioContext.createGain();

        oscillator2.type = "sine";

        oscillator2.frequency.setValueAtTime(1047, now + 0.12);

        gainNode2.gain.setValueAtTime(0.001, now + 0.12);

        gainNode2.gain.exponentialRampToValueAtTime(0.18, now + 0.135);

        gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        oscillator2.connect(gainNode2);

        gainNode2.connect(audioContext.destination);

        oscillator2.start(now + 0.12);

        oscillator2.stop(now + 0.33);

        oscillator2.addEventListener("ended", () => {
            audioContext.close();
        });

    } catch (error) {

        console.error("Ошибка звука уведомления:", error);
    }
}

export default useNotifications;