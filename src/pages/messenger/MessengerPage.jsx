import {
    useEffect, useState
} from "react";

import {
    useOutletContext
} from "react-router-dom";

import ChatSidebar from "../../components/messenger/ChatSidebar.jsx";
import EmptyChat from "../../components/messenger/EmptyChat.jsx";
import ChatHeader from "../../components/messenger/ChatHeader.jsx";
import MessagesContainer from "../../components/messenger/MessagesContainer.jsx";
import MessageInput from "../../components/messenger/MessageInput.jsx";
import GroupChatSettingsModal from "../../components/messenger/GroupChatSettingsModal.jsx";
import NotificationBell from "../../components/notifications/NotificationBell.jsx";

import useMessengerController from "../../hooks/messenger/useMessengerController.js";

import {
    getOtherUsername, getOtherAvatar
} from "../../utils/chatUtils.js";

import "./MessengerPage.css";

function MessengerPage() {
    const {
        setMobileChatOpen
    } = useOutletContext();

    const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);

    const {
        currentUser,
        currentUsername,
        loadingCurrentUser,
        chats,
        selectedChat,
        messages,
        content,
        setContent,
        onlineUsers,
        error,
        loadingMessages,
        loadingOlderMessages,
        messagesContainerRef,
        notifications,
        unreadCount,
        deleteNotification,
        deleteAllNotifications,
        selectChat,
        openChatById,
        createChat,
        createGroup,
        closeChat,
        sendMessage,
        handleMessagesScroll,
        deleteMessage,
        updateGroup,
        uploadAvatar,
        deleteAvatar,
        addMember,
        removeMember,
        changeRole,
        transferOwnership,
        leaveGroup,
        deleteGroup
    } = useMessengerController();

    useEffect(() => {
        setMobileChatOpen(Boolean(selectedChat));

        return () => {
            setMobileChatOpen(false);
        };
    }, [selectedChat, setMobileChatOpen]);

    useEffect(() => {
        if (selectedChat?.type !== "GROUP") {
            setGroupSettingsOpen(false);
        }
    }, [selectedChat]);

    const isGroup = selectedChat?.type === "GROUP";

    const currentMember = selectedChat?.members?.find(member => Number(member.userId) === Number(currentUser?.id));

    const currentUserRole = currentMember?.role || "MEMBER";

    const selectedUsername = isGroup ? selectedChat?.name : getOtherUsername(selectedChat, currentUsername);

    const selectedAvatar = isGroup ? selectedChat?.avatar : getOtherAvatar(selectedChat, currentUsername);

    const handleCloseChat = () => {
        setGroupSettingsOpen(false);
        closeChat();
        setMobileChatOpen(false);
    };

    const handleOpenGroupSettings = () => {
        if (!isGroup) {
            return;
        }

        setGroupSettingsOpen(true);
    };

    const handleCloseGroupSettings = () => {
        setGroupSettingsOpen(false);
    };

    if (loadingCurrentUser) {
        return (<div className="messenger-page">
                Загрузка Messenger...
            </div>);
    }

    return (<div className="messenger-page">
            <div className="messenger-notifications">
                <NotificationBell
                    notifications={notifications}
                    unreadCount={unreadCount}
                    deleteNotification={deleteNotification}
                    deleteAllNotifications={deleteAllNotifications}
                    onOpenChat={openChatById}
                />
            </div>

            <div
                className={`messenger-container ${selectedChat ? "mobile-chat-open" : ""}`}
            >
                <ChatSidebar
                    chats={chats}
                    currentUsername={currentUsername}
                    selectedChat={selectedChat}
                    onSelectChat={selectChat}
                    onCreateChat={createChat}
                    onCreateGroup={createGroup}
                    error={error}
                />

                <main className="messenger-chat">
                    {!selectedChat ? (<EmptyChat/>) : (<>
                            <ChatHeader
                                username={selectedUsername}
                                avatar={selectedAvatar}
                                onlineUsers={onlineUsers}
                                isGroup={isGroup}
                                onBack={handleCloseChat}
                                onGroupSettings={handleOpenGroupSettings}
                            />

                            <MessagesContainer
                                messages={messages}
                                currentUsername={currentUsername}
                                loadingMessages={loadingMessages}
                                loadingOlderMessages={loadingOlderMessages}
                                containerRef={messagesContainerRef}
                                onScroll={handleMessagesScroll}
                                onDeleteMessage={deleteMessage}
                                isGroup={isGroup}
                                currentUserRole={currentUserRole}
                            />

                            <MessageInput
                                content={content}
                                onChange={setContent}
                                onSend={sendMessage}
                            />
                        </>)}
                </main>
            </div>

            {groupSettingsOpen && selectedChat && isGroup && (<GroupChatSettingsModal
                    chat={selectedChat}
                    currentUserId={currentUser?.id}
                    onClose={handleCloseGroupSettings}
                    onUpdateGroup={updateGroup}
                    onUploadAvatar={uploadAvatar}
                    onDeleteAvatar={deleteAvatar}
                    onAddMember={addMember}
                    onRemoveMember={removeMember}
                    onChangeRole={changeRole}
                    onTransferOwnership={transferOwnership}
                    onLeaveGroup={leaveGroup}
                    onDeleteGroup={deleteGroup}
                />)}
        </div>);
}

export default MessengerPage;