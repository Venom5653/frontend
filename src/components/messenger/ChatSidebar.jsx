import React, {useState} from "react";

import ChatItem from "./ChatItem.jsx";

import "./ChatSidebar.css";


const ChatSidebar = ({
                         chats, currentUsername, selectedChat, onSelectChat, onCreateChat, error
                     }) => {

    const [username, setUsername] = useState("");


    const handleCreateChat = async () => {

        const value = username.trim();

        if (!value) {
            return;
        }

        await onCreateChat(value);

        setUsername("");
    };


    return (

        <aside className="messenger-sidebar">

            <div className="messenger-sidebar-header">

                <h1>
                    Messages
                </h1>

            </div>


            <div className="new-chat">

                <input
                    type="text"
                    placeholder="Имя пользователя"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    onKeyDown={(event) => {

                        if (event.key === "Enter") {
                            handleCreateChat();
                        }

                    }}
                />

                <button
                    type="button"
                    onClick={handleCreateChat}
                >
                    +
                </button>

            </div>


            {error && (

                <div className="messenger-error">
                    {error}
                </div>

            )}


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

        </aside>);
};


export default ChatSidebar;