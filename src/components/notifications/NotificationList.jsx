function NotificationList({
                              notifications, unreadCount, onNotificationClick, onDeleteAll
                          }) {

    const safeNotifications = Array.isArray(notifications) ? notifications : [];

    const safeUnreadCount = Number.isFinite(Number(unreadCount)) ? Number(unreadCount) : 0;

    return (<div className="notification-dropdown">

            <div className="notification-header">

                <div className="notification-title">

                    Уведомления

                    {safeUnreadCount > 0 && (<span className="notification-header-count">
                            {safeUnreadCount}
                        </span>)}

                </div>

                {safeNotifications.length > 0 && (<button
                        type="button"
                        className="notification-read-all"
                        onClick={onDeleteAll}
                    >
                        Очистить все
                    </button>)}

            </div>

            <div className="notification-content">

                {safeNotifications.length === 0 && (<div className="notification-empty">

                        <div className="notification-empty-icon">
                            🔔
                        </div>

                        <div>
                            Нет уведомлений
                        </div>

                    </div>)}

                {safeNotifications.length > 0 && (<div className="notification-items">

                        {safeNotifications.map(notification => {

                            if (!notification) {
                                return null;
                            }

                            const isGroup = Boolean(notification.chatName);

                            return (<button
                                    type="button"
                                    key={`${notification.id}-${notification.chatId}`}
                                    className={`notification-item ${notification.read ? "read" : "unread"}`}
                                    onClick={() => onNotificationClick(notification)}
                                >

                                    <div className="notification-item-icon">
                                        {isGroup ? "👥" : "💬"}
                                    </div>

                                    <div className="notification-item-body">

                                        <div className="notification-item-top">

                                            <span className="notification-sender">
                                                {isGroup ? notification.chatName : notification.senderUsername}
                                            </span>

                                            {!notification.read && (<span className="notification-unread-dot"/>)}

                                        </div>

                                        <div className="notification-message">

                                            {isGroup ? `${notification.senderUsername}: ${notification.content || ""}` : notification.content || ""}

                                        </div>

                                        <div className="notification-time">
                                            {formatNotificationDate(notification.createdAt)}
                                        </div>

                                    </div>

                                </button>);
                        })}

                    </div>)}

            </div>

        </div>);
}

function formatNotificationDate(date) {

    if (!date) {
        return "";
    }

    const notificationDate = new Date(date);

    if (Number.isNaN(notificationDate.getTime())) {
        return "";
    }

    return notificationDate.toLocaleString("ru-RU", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
    });
}

export default NotificationList;