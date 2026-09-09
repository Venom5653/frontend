import React, { useMemo, useState } from "react";

import ChatItem from "./ChatItem.jsx";
import GroupChatModal from "./GroupChatModal.jsx";

import "./ChatSidebar.css";


const ChatSidebar = ({
                         chats,
                         currentUsername,
                         selectedChat,
                         onSelectChat,
                         onCreateChat,
                         onCreateGroup,
                         error
                     }) => {

    const [username, setUsername] = useState("");
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("PRIVATE");


    const privateChats = useMemo(
        () =>
            chats.filter(
                chat => chat.type === "PRIVATE"
            ),
        [chats]
    );


    const groupChats = useMemo(
        () =>
            chats.filter(
                chat => chat.type === "GROUP"
            ),
        [chats]
    );


    const visibleChats =
        activeTab === "GROUP"
            ? groupChats
            : privateChats;


    const handleCreateChat = async () => {

        const value =
            username.trim();


        if (!value) {
            return;
        }


        await onCreateChat(value);

        setUsername("");

    };


    const handleKeyDown = event => {

        if (event.key !== "Enter") {
            return;
        }


        event.preventDefault();

        handleCreateChat();

    };


    const handleCreateGroup = async (
        name,
        userIds
    ) => {

        const success =
            await onCreateGroup(
                name,
                userIds
            );


        if (success !== false) {

            setGroupModalOpen(false);

        }

    };


    const handleTabChange = tab => {

        setActiveTab(tab);

        setUsername("");

    };


    return (

        <aside className="messenger-sidebar">

            <div className="messenger-sidebar-header">

                <h1>
                    Чаты
                </h1>

            </div>


            <div className="chat-tabs">

                <button
                    type="button"
                    className={
                        activeTab === "PRIVATE"
                            ? "chat-tab active"
                            : "chat-tab"
                    }
                    onClick={() =>
                        handleTabChange("PRIVATE")
                    }
                >
                    Личные
                </button>


                <button
                    type="button"
                    className={
                        activeTab === "GROUP"
                            ? "chat-tab active"
                            : "chat-tab"
                    }
                    onClick={() =>
                        handleTabChange("GROUP")
                    }
                >
                    Группы
                </button>

            </div>


            {activeTab === "PRIVATE" && (

                <div className="new-chat">

                    <input
                        type="text"
                        placeholder="Найти пользователя"
                        value={username}
                        onChange={event =>
                            setUsername(
                                event.target.value
                            )
                        }
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

            )}


            {activeTab === "GROUP" && (

                <button
                    type="button"
                    className="create-group-button"
                    onClick={() =>
                        setGroupModalOpen(true)
                    }
                >
                    + Группа
                </button>

            )}


            {error && (

                <div className="messenger-error">
                    {error}
                </div>

            )}


            <div className="chat-list">

                {visibleChats.length === 0 ? (

                    <div className="empty-chats">

                        {activeTab === "GROUP"
                            ? "У вас пока нет групп"
                            : "У вас пока нет личных чатов"}

                    </div>

                ) : (

                    visibleChats.map(chat => (

                        <ChatItem
                            key={chat.id}
                            chat={chat}
                            currentUsername={
                                currentUsername
                            }
                            selected={
                                selectedChat?.id ===
                                chat.id
                            }
                            onClick={() =>
                                onSelectChat(chat)
                            }
                        />

                    ))

                )}

            </div>


            {groupModalOpen && (

                <GroupChatModal
                    currentUsername={
                        currentUsername
                    }
                    onClose={() =>
                        setGroupModalOpen(false)
                    }
                    onCreateGroup={
                        handleCreateGroup
                    }
                />

            )}

        </aside>

    );

};


export default ChatSidebar;