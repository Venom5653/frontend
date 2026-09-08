function NotificationList({
                              notifications, unreadCount, onNotificationClick, onDeleteAll
                          }) {

    return (

        <div className="notification-dropdown">


            {/* =========================================
                HEADER
            ========================================= */}

            <div className="notification-header">


                <div className="notification-title">

                    Уведомления


                    {unreadCount > 0 && (

                        <span className="notification-header-count">

                            {unreadCount}

                        </span>

                    )}

                </div>


                {notifications.length > 0 && (

                    <button

                        type="button"

                        className="notification-read-all"

                        onClick={onDeleteAll}

                    >
                        Очистить все

                    </button>

                )}

            </div>


            {/* =========================================
                CONTENT
            ========================================= */}

            <div className="notification-content">


                {notifications.length === 0 && (

                    <div className="notification-empty">

                        <div className="notification-empty-icon">

                            🔔

                        </div>

                        <div>

                            Нет уведомлений

                        </div>

                    </div>

                )}


                {notifications.length > 0 && (

                    <div className="notification-items">

                        {notifications.map(notification => (

                            <button

                                type="button"

                                key={notification.id}

                                className={`notification-item ${notification.read ? "read" : "unread"}`}

                                onClick={() => onNotificationClick(notification)}

                            >


                                {/* =================================
                                        ICON
                                    ================================= */}

                                <div className="notification-item-icon">

                                    💬

                                </div>


                                {/* =================================
                                        BODY
                                    ================================= */}

                                <div className="notification-item-body">


                                    <div className="notification-item-top">

                                            <span className="notification-sender">

                                                {notification.senderUsername}

                                            </span>


                                        {!notification.read && (

                                            <span className="notification-unread-dot"/>

                                        )}

                                    </div>


                                    <div className="notification-message">

                                        {notification.content}

                                    </div>


                                    <div className="notification-time">

                                        {formatNotificationDate(notification.createdAt)}

                                    </div>


                                </div>

                            </button>

                        ))}

                    </div>

                )}

            </div>

        </div>

    );

}


/*
 * =====================================================
 * DATE FORMAT
 * =====================================================
 */

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