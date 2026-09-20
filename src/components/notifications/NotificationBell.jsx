import {
    useEffect, useRef, useState
} from "react";

import NotificationList from "./NotificationList.jsx";

import "./notifications.css";

function NotificationBell({
                              notifications, unreadCount, deleteNotification, deleteAllNotifications, onOpenChat
                          }) {

    const [isOpen, setIsOpen] = useState(false);

    const notificationRef = useRef(null);

    const handleToggle = () => {
        setIsOpen(previous => !previous);
    };

    useEffect(() => {

        if (!isOpen) {
            return;
        }

        const handleClickOutside = event => {

            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsOpen(false);
            }

        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };

    }, [isOpen]);

    const handleNotificationClick = async notification => {

        if (!notification) {
            return;
        }

        if (onOpenChat && notification.chatId != null) {
            await onOpenChat(notification.chatId);
        }

        setIsOpen(false);
    };

    const handleDeleteAll = async event => {

        event.stopPropagation();

        const deleted = await deleteAllNotifications();

        if (deleted) {
            setIsOpen(false);
        }
    };

    const safeNotifications = Array.isArray(notifications) ? notifications : [];

    const safeUnreadCount = Number.isFinite(Number(unreadCount)) ? Number(unreadCount) : 0;

    return (<div
            ref={notificationRef}
            className="notification-container"
        >

            <button
                type="button"
                className="notification-bell"
                onClick={handleToggle}
                aria-label="Уведомления"
                aria-expanded={isOpen}
            >

                <span className="notification-bell-icon">
                    🔔
                </span>

                {safeUnreadCount > 0 && (<span className="notification-badge">
                        {safeUnreadCount > 99 ? "99+" : safeUnreadCount}
                    </span>)}

            </button>

            {isOpen && (<NotificationList
                    notifications={safeNotifications}
                    unreadCount={safeUnreadCount}
                    onNotificationClick={handleNotificationClick}
                    onDeleteAll={handleDeleteAll}
                />)}

        </div>);
}

export default NotificationBell;