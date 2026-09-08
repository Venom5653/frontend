import {
    useEffect
} from "react";

import {
    useOutletContext
} from "react-router-dom";

import ChatSidebar from "../../components/messenger/ChatSidebar.jsx";

import EmptyChat from "../../components/messenger/EmptyChat.jsx";

import ChatHeader from "../../components/messenger/ChatHeader.jsx";

import MessagesContainer from "../../components/messenger/MessagesContainer.jsx";

import MessageInput from "../../components/messenger/MessageInput.jsx";

import NotificationBell from "../../components/notifications/NotificationBell.jsx";

import useMessengerController from "../../hooks/messenger/useMessengerController.js";

import {
    getOtherUsername, getOtherAvatar
} from "../../utils/chatUtils.js";

import "./MessengerPage.css";


function MessengerPage() {


    // =====================================================
    // OUTLET
    // =====================================================

    const {
        setMobileChatOpen
    } = useOutletContext();


    // =====================================================
    // MESSENGER CONTROLLER
    // =====================================================

    const {

        currentUsername,

        loadingCurrentUser,

        chats,

        selectedChat,

        messages,

        content,

        onlineUsers,

        error,

        loadingMessages,

        loadingOlderMessages,

        messagesContainerRef,

        notifications,

        unreadCount,

        deleteNotification,

        deleteAllNotifications,

        setContent,

        selectChat,

        openChatById,

        createChat,

        closeChat,

        sendMessage,

        handleMessagesScroll

    } = useMessengerController();


    // =====================================================
    // MOBILE
    // =====================================================

    useEffect(() => {

        setMobileChatOpen(Boolean(selectedChat));


        return () => {

            setMobileChatOpen(false);

        };

    }, [selectedChat, setMobileChatOpen]);


    // =====================================================
    // SELECTED USER
    // =====================================================

    const selectedUsername = getOtherUsername(selectedChat, currentUsername);


    const selectedAvatar = getOtherAvatar(selectedChat, currentUsername);


    // =====================================================
    // CLOSE CHAT
    // =====================================================

    const handleCloseChat = () => {

        closeChat();

        setMobileChatOpen(false);

    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loadingCurrentUser) {

        return (

            <div className="messenger-page">

                Загрузка Messenger...

            </div>

        );

    }


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="messenger-page">


            {/* =========================================
                NOTIFICATIONS
            ========================================= */}

            <div className="messenger-notifications">

                <NotificationBell

                    notifications={notifications}

                    unreadCount={unreadCount}

                    deleteNotification={deleteNotification}

                    deleteAllNotifications={deleteAllNotifications}

                    onOpenChat={openChatById}

                />

            </div>


            {/* =========================================
                MESSENGER CONTAINER
            ========================================= */}

            <div
                className={`messenger-container ${selectedChat ? "mobile-chat-open" : ""}`}
            >


                {/* =====================================
                    SIDEBAR
                ===================================== */}

                <ChatSidebar

                    chats={chats}

                    currentUsername={currentUsername}

                    selectedChat={selectedChat}

                    onSelectChat={selectChat}

                    onCreateChat={createChat}

                    error={error}

                />


                {/* =====================================
                    CHAT
                ===================================== */}

                <main className="messenger-chat">


                    {!selectedChat ? (

                        <EmptyChat/>

                    ) : (

                        <>


                            <ChatHeader

                                username={selectedUsername}

                                avatar={selectedAvatar}

                                onlineUsers={onlineUsers}

                                onBack={handleCloseChat}

                            />


                            <MessagesContainer

                                messages={messages}

                                currentUsername={currentUsername}

                                loadingMessages={loadingMessages}

                                loadingOlderMessages={loadingOlderMessages}

                                containerRef={messagesContainerRef}

                                onScroll={handleMessagesScroll}

                            />


                            <MessageInput

                                content={content}

                                onChange={setContent}

                                onSend={sendMessage}

                            />

                        </>

                    )}

                </main>

            </div>

        </div>

    );

}


export default MessengerPage;