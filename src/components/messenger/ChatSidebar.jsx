import React, {useState} from "react";

import ChatItem from "./ChatItem.jsx";

import "./ChatSidebar.css";


const ChatSidebar = ({
                         chats, currentUsername, selectedChat, onSelectChat, onCreateChat, error
                     }) => {

    const [username, setUsername] = useState("");


    // =====================================================
    // CREATE CHAT
    // =====================================================

    const handleCreateChat = async () => {

        const value = username.trim();

        if (!value) {
            return;
        }

        await onCreateChat(value);

        setUsername("");
    };


    // =====================================================
    // ENTER
    // =====================================================

    const handleKeyDown = (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            handleCreateChat();
        }
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <aside className="messenger-sidebar">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="messenger-sidebar-header">

                <h1>
                    Чаты
                </h1>

            </div>


            {/* =================================================
                NEW CHAT
            ================================================= */}

            <div className="new-chat">

                <input
                    type="text"
                    placeholder="Найти пользователя"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    onKeyDown={handleKeyDown}
                />

                <button
                    type="button"
                    onClick={handleCreateChat}
                    aria-label="Создать чат"
                >
                    +
                </button>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="messenger-error">
                    {error}
                </div>

            )}


            {/* =================================================
                CHAT LIST
            ================================================= */}

            <div className="chat-list">

                {chats.length === 0 ? (

                    <div className="empty-chats">
                        У вас пока нет чатов
                    </div>

                ) : (

                    chats.map(chat => (

                        <ChatItem
                            key={chat.id}
                            chat={chat}
                            currentUsername={currentUsername}
                            selected={selectedChat?.id === chat.id}
                            onClick={() => onSelectChat(chat)}
                        />

                    ))

                )}

            </div>

        </aside>

    );
};


export default ChatSidebar;