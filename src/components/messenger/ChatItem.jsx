import React, {useState} from "react";

import "./ChatItem.css";


const ChatItem = ({
                      chat, currentUsername, selected, onClick
                  }) => {

    const [avatarError, setAvatarError] = useState(false);


    // =====================================================
    // OTHER USER
    // =====================================================

    const user1 = chat.user1Username?.trim();

    const user2 = chat.user2Username?.trim();

    const normalizedCurrent = currentUsername?.trim().toLowerCase();


    const isUser1 = user1 && normalizedCurrent && user1.toLowerCase() === normalizedCurrent;


    const otherUsername = isUser1 ? user2 : user1;


    // =====================================================
    // AVATAR
    // =====================================================

    const avatar = isUser1 ? chat.user2Avatar : chat.user1Avatar;


    const getAvatarUrl = (value) => {

        if (!value || typeof value !== "string") {
            return null;
        }

        const trimmed = value.trim();

        if (!trimmed) {
            return null;
        }

        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }

        if (trimmed.startsWith("/")) {
            return `http://localhost:8080${trimmed}`;
        }

        return `http://localhost:8080/${trimmed}`;
    };


    const avatarUrl = getAvatarUrl(avatar);


    const avatarLetter = otherUsername
        ?.charAt(0)
        ?.toUpperCase() || "?";


    // =====================================================
    // TIME
    // =====================================================

    const formatTime = (date) => {

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


    const lastMessage = chat.lastMessage || "Пока нет сообщений";


    const unreadCount = Number(chat.unreadCount) || 0;


    return (

        <button
            type="button"
            className={`chat-item ${selected ? "active" : ""}`}
            onClick={onClick}
        >

            {/* =================================================
                AVATAR
            ================================================= */}

            <div className="chat-item-avatar">

                {avatarUrl && !avatarError ? (

                    <img
                        src={avatarUrl}
                        alt={otherUsername || "User"}
                        onError={() => setAvatarError(true)}
                    />

                ) : (

                    <span>
                        {avatarLetter}
                    </span>

                )}

            </div>


            {/* =================================================
                INFO
            ================================================= */}

            <div className="chat-info">

                <div className="chat-info-header">

                    <div className="chat-name">
                        {otherUsername || "Неизвестный пользователь"}
                    </div>

                    <div className="chat-time">
                        {formatTime(chat.lastMessageCreatedAt)}
                    </div>

                </div>


                <div className="chat-preview-row">

                    <div className="chat-preview">
                        {lastMessage}
                    </div>


                    {unreadCount > 0 && (

                        <div className="unread-badge">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </div>

                    )}

                </div>

            </div>

        </button>);
};


export default ChatItem;