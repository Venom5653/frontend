import {
    useEffect, useRef, useState
} from "react";

import NotificationList from "./NotificationList.jsx";

import "./notifications.css";


function NotificationBell({
                              notifications, unreadCount, deleteNotification, deleteAllNotifications, onOpenChat
                          }) {


    // =====================================================
    // STATE
    // =====================================================

    const [isOpen, setIsOpen] = useState(false);


    // =====================================================
    // REF
    // =====================================================

    const notificationRef = useRef(null);


    // =====================================================
    // TOGGLE
    // =====================================================

    const handleToggle = () => {

        setIsOpen(previous => !previous);

    };


    // =====================================================
    // CLICK OUTSIDE
    // =====================================================

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


    const handleNotificationClick =
        async notification => {

            if (!notification) {
                return;
            }

            if (onOpenChat) {

                await onOpenChat(
                    notification.chatId
                );
            }

            setIsOpen(false);
        };


    // =====================================================
    // DELETE ALL
    // =====================================================

    const handleDeleteAll = async event => {

        event.stopPropagation();


        const deleted = await deleteAllNotifications();


        /*
         * После успешного удаления
         * закрываем dropdown.
         */

        if (deleted) {

            setIsOpen(false);

        }

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div
            ref={notificationRef}
            className="notification-container"
        >


            {/* =========================================
                BELL
            ========================================= */}

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


                {unreadCount > 0 && (

                    <span className="notification-badge">

                        {unreadCount > 99 ? "99+" : unreadCount}

                    </span>

                )}

            </button>


            {/* =========================================
                DROPDOWN
            ========================================= */}

            {isOpen && (

                <NotificationList

                    notifications={notifications}

                    unreadCount={unreadCount}

                    onNotificationClick={handleNotificationClick}

                    onDeleteAll={handleDeleteAll}

                />

            )}

        </div>

    );

}


export default NotificationBell;