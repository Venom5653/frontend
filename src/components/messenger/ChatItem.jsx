import React, { useEffect, useState } from "react";

import {
    getChatDisplayName,
    getChatAvatar,
    getAvatarUrl,
    getAvatarLetter,
    formatTime
} from "../../utils/chatUtils.js";

import "./ChatItem.css";


const ChatItem = ({
                      chat,
                      currentUsername,
                      selected,
                      onClick
                  }) => {

    // =====================================================
    // STATE
    // =====================================================

    const [avatarError, setAvatarError] = useState(false);


    // =====================================================
    // CHAT DISPLAY DATA
    // =====================================================

    const chatName = getChatDisplayName(chat, currentUsername);

    const avatar = getChatAvatar(chat, currentUsername);

    const avatarUrl = getAvatarUrl(avatar);

    const avatarLetter = getAvatarLetter(chatName);


    // =====================================================
    // RESET AVATAR ERROR
    // =====================================================

    useEffect(() => {
        setAvatarError(false);
    }, [chat.id, avatar]);


    // =====================================================
    // DATA
    // =====================================================

    const lastMessage = chat.lastMessage || "Пока нет сообщений";

    const unreadCount = Number(chat.unreadCount) || 0;


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <button
            type="button"
            className={`chat-item ${selected ? "active" : ""}`}
            onClick={onClick}
        >

            {/* =============================================
                AVATAR
            ============================================= */}

            <div className="chat-item-avatar">

                {avatarUrl && !avatarError ? (

                    <img
                        src={avatarUrl}
                        alt={chatName || "Chat"}
                        onError={() => setAvatarError(true)}
                    />

                ) : (

                    <span>
                        {avatarLetter}
                    </span>

                )}

            </div>


            {/* =============================================
                INFO
            ============================================= */}

            <div className="chat-info">

                {/* HEADER */}

                <div className="chat-info-header">

                    <div className="chat-name">

                        {chatName || "Неизвестный чат"}

                    </div>


                    <div className="chat-time">

                        {formatTime(
                            chat.lastMessageCreatedAt ||
                            chat.lastMessageAt
                        )}

                    </div>

                </div>


                {/* PREVIEW */}

                <div className="chat-preview-row">

                    <div className="chat-preview">

                        {lastMessage}

                    </div>


                    {unreadCount > 0 && (

                        <div className="unread-badge">

                            {unreadCount > 99
                                ? "99+"
                                : unreadCount}

                        </div>

                    )}

                </div>

            </div>

        </button>
    );
};


export default ChatItem;