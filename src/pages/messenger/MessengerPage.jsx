import {
    useEffect, useLayoutEffect, useRef, useState
} from "react";

import ChatSidebar from "../../components/messenger/ChatSidebar.jsx";

import messengerApi from "../../api/messenger/messengerApi.js";

import {
    messageBelongsToChat
} from "../../utils/chatUtils.js";

import {
    connectWebSocket, disconnectWebSocket, subscribeToMessages, sendChatMessage, subscribeToReadEvents
} from "../../services/messenger/websocketService.js";

import "./MessengerPage.css";


function MessengerPage() {

    // =====================================================
    // STATE
    // =====================================================
    const API_URL = import.meta.env.VITE_API_URL;

    const [currentUser, setCurrentUser] = useState(null);

    const [chats, setChats] = useState([]);

    const [selectedChat, setSelectedChat] = useState(null);

    const [messages, setMessages] = useState([]);

    const [content, setContent] = useState("");

    const [error, setError] = useState("");

    const [loadingMessages, setLoadingMessages] = useState(false);

    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

    const [hasMoreMessages, setHasMoreMessages] = useState(true);

    const messagesContainerRef = useRef(null);

    const chatsRef = useRef([]);

    const selectedChatRef = useRef(null);

    const shouldScrollToBottomRef = useRef(true);

    const isOpeningChatRef = useRef(false);

    const previousScrollHeightRef = useRef(null);


    /*
     * Защита от повторной загрузки старых сообщений.
     */
    const loadingOlderMessagesRef = useRef(false);


    /*
     * Используем для контроля последнего ID.
     */
    const oldestMessageIdRef = useRef(null);


    // =====================================================
    // CURRENT USERNAME
    // =====================================================

    const currentUsername = currentUser?.username || null;


    // =====================================================
    // AVATAR URL
    // =====================================================

    const getAvatarUrl = (avatar) => {

        if (!avatar || typeof avatar !== "string") {
            return null;
        }

        const value = avatar.trim();

        if (!value) {
            return null;
        }

        if (value.startsWith("http://") || value.startsWith("https://")) {
            return value;
        }

        if (value.startsWith("/")) {
            return `${API_URL}${value}`;
        }

        return `${API_URL}/${value}`;
    };


    // =====================================================
    // AVATAR LETTER
    // =====================================================

    const getAvatarLetter = (username) => {

        if (!username) {
            return "?";
        }

        return username
            .trim()
            .charAt(0)
            .toUpperCase();
    };


    // =====================================================
    // OTHER USERNAME
    // =====================================================

    const getOtherUsername = (chat) => {

        if (!chat) {
            return null;
        }

        const user1 = chat.user1Username?.trim();

        const user2 = chat.user2Username?.trim();

        if (!currentUsername) {
            return user1 || user2 || null;
        }

        const normalizedCurrent = currentUsername.trim().toLowerCase();

        if (user1 && user1.toLowerCase() === normalizedCurrent) {
            return user2 || null;
        }

        if (user2 && user2.toLowerCase() === normalizedCurrent) {
            return user1 || null;
        }

        return user1 || user2 || null;
    };


    // =====================================================
    // OTHER AVATAR
    // =====================================================

    const getOtherAvatar = (chat) => {

        if (!chat) {
            return null;
        }

        const user1 = chat.user1Username?.trim();

        const user2 = chat.user2Username?.trim();

        if (!currentUsername) {

            return (chat.user1Avatar || chat.user2Avatar || null);
        }

        const normalizedCurrent = currentUsername.trim().toLowerCase();

        if (user1 && user1.toLowerCase() === normalizedCurrent) {
            return chat.user2Avatar || null;
        }

        if (user2 && user2.toLowerCase() === normalizedCurrent) {
            return chat.user1Avatar || null;
        }

        return (chat.user1Avatar || chat.user2Avatar || null);
    };


    // =====================================================
    // CURRENT USER
    // =====================================================

    const loadCurrentUser = async () => {

        try {

            const response = await messengerApi.get("/api/users/me");

            const user = response.data;

            setCurrentUser(user);

            if (user?.username) {

                localStorage.setItem("username", user.username);
            }

            return user;

        } catch (err) {

            console.error("Ошибка загрузки пользователя:", err);

            setError("Не удалось определить текущего пользователя");

            return null;
        }
    };


    // =====================================================
    // LOAD CHATS
    // =====================================================

    const loadChats = async () => {

        try {

            const response = await messengerApi.get("/api/chats");

            const chatList = Array.isArray(response.data) ? response.data : [];

            setChats(chatList);

            chatsRef.current = chatList;

            return chatList;

        } catch (err) {

            console.error("Ошибка загрузки чатов:", err);

            setError(err.response?.data?.message || "Не удалось загрузить чаты");

            return [];
        }
    };


    // =====================================================
    // INITIALIZATION
    // =====================================================

    useEffect(() => {

        const init = async () => {

            const user = await loadCurrentUser();

            if (!user) {
                return;
            }

            await loadChats();
        };

        init();

    }, []);


    // =====================================================
    // WEBSOCKET
    // =====================================================

    useEffect(() => {

        if (!currentUsername) {
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {

            console.warn("JWT token отсутствует");

            return;
        }


        connectWebSocket(token, () => {

            subscribeToMessages(async (message) => {

                console.log("Новое сообщение:", message);


                const currentChats = chatsRef.current;

                const currentChat = selectedChatRef.current;


                // =========================================
                // FIND CHAT
                // =========================================

                const messageChat = currentChats.find(chat => messageBelongsToChat(message, chat));


                // =========================================
                // CURRENT CHAT
                // =========================================

                const isCurrentChat = currentChat && messageBelongsToChat(message, currentChat);


                // =========================================
                // OWN MESSAGE
                // =========================================

                const isOwn = message.senderUsername && currentUsername && message.senderUsername
                    .toLowerCase() === currentUsername.toLowerCase();


                // =========================================
                // ADD MESSAGE
                // =========================================

                if (isCurrentChat) {

                    shouldScrollToBottomRef.current = true;


                    setMessages(previous => {

                        const exists = previous.some(item => item.id === message.id);

                        if (exists) {
                            return previous;
                        }

                        return [...previous, message];
                    });


                    // =====================================
                    // MARK READ
                    // =====================================

                    if (message.chatId) {

                        try {

                            await messengerApi.put(`/api/messages/chat/${message.chatId}/read`);

                        } catch (error) {

                            console.error("Ошибка отметки сообщений прочитанными:", error);
                        }
                    }
                }


                // =========================================
                // UPDATE SIDEBAR
                // =========================================

                if (messageChat) {

                    setChats(previous => {

                        const updated = previous.map(chat => {

                            if (chat.id !== messageChat.id) {
                                return chat;
                            }

                            const unread = Number(chat.unreadCount || 0);

                            return {

                                ...chat,

                                lastMessage: message.content,

                                lastMessageCreatedAt: message.createdAt,

                                unreadCount: isCurrentChat || isOwn ? 0 : unread + 1
                            };
                        });


                        updated.sort((a, b) => new Date(b.lastMessageCreatedAt || b.createdAt) - new Date(a.lastMessageCreatedAt || a.createdAt));


                        chatsRef.current = updated;

                        return updated;
                    });

                } else {

                    await loadChats();
                }

            });


            // =========================================
            // MESSAGE READ EVENTS
            // =========================================

            subscribeToReadEvents((event) => {

                console.log("Сообщения прочитаны:", event);


                setMessages(previous => previous.map(message => {

                    if (message.id === event.messageId) {

                        return {
                            ...message, read: true
                        };
                    }

                    return message;
                }));

            });

        });


        return () => {

            disconnectWebSocket();

        };

    }, [currentUsername]);


    // =====================================================
    // SYNC CHATS REF
    // =====================================================

    useEffect(() => {

        chatsRef.current = chats;

    }, [chats]);


    // =====================================================
    // SYNC SELECTED CHAT REF
    // =====================================================

    useEffect(() => {

        selectedChatRef.current = selectedChat;

    }, [selectedChat]);


    // =====================================================
    // CHECK BOTTOM
    // =====================================================

    const checkIfNearBottom = () => {

        const container = messagesContainerRef.current;

        if (!container) {
            return;
        }


        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;


        shouldScrollToBottomRef.current = distanceFromBottom <= 150;
    };


    // =====================================================
    // LOAD OLDER MESSAGES
    // =====================================================

    const loadOlderMessages = async () => {

        if (loadingOlderMessagesRef.current) {
            return;
        }

        if (!selectedChat) {
            return;
        }

        if (!messages.length) {
            return;
        }

        if (!hasMoreMessages) {
            return;
        }


        const oldestMessage = messages[0];


        if (!oldestMessage?.id) {
            return;
        }


        const container = messagesContainerRef.current;

        if (!container) {
            return;
        }


        loadingOlderMessagesRef.current = true;

        setLoadingOlderMessages(true);


        /*
         * Запоминаем положение контейнера
         * ДО загрузки старых сообщений.
         */

        previousScrollHeightRef.current = container.scrollHeight;


        const previousScrollTop = container.scrollTop;


        try {

            const response = await messengerApi.get(`/api/messages/chat/${selectedChat.id}`, {
                params: {
                    beforeId: oldestMessage.id, limit: 50
                }
            });


            const olderMessages = Array.isArray(response.data) ? response.data : [];


            /*
             * Backend возвращает сообщения
             * от старых к новым.
             */

            if (!olderMessages.length) {

                setHasMoreMessages(false);

                return;
            }


            /*
             * Защита от дублей.
             */

            setMessages(previous => {

                const existingIds = new Set(previous.map(message => message.id));


                const uniqueOlderMessages = olderMessages.filter(message => !existingIds.has(message.id));


                if (!uniqueOlderMessages.length) {
                    return previous;
                }


                return [...uniqueOlderMessages, ...previous];
            });


            /*
             * Если пришло меньше 50,
             * значит это последняя порция.
             */

            if (olderMessages.length < 50) {

                setHasMoreMessages(false);
            }


            /*
             * Сохраняем старое положение.
             *
             * После render useLayoutEffect
             * восстановит scrollTop.
             */

            previousScrollHeightRef.current = {
                height: previousScrollHeightRef.current, top: previousScrollTop
            };

        } catch (error) {

            console.error("Ошибка загрузки старых сообщений:", error);

            setError(error.response?.data?.message || "Не удалось загрузить старые сообщения");

        } finally {

            setLoadingOlderMessages(false);

            loadingOlderMessagesRef.current = false;
        }
    };


    // =====================================================
    // SCROLL
    // =====================================================

    const handleMessagesScroll = () => {

        const container = messagesContainerRef.current;

        if (!container) {
            return;
        }


        /*
         * Определяем положение относительно низа.
         */

        checkIfNearBottom();


        /*
         * Если пользователь приблизился
         * к верхней границе — грузим старые сообщения.
         */

        if (container.scrollTop <= 100 && !loadingOlderMessagesRef.current && hasMoreMessages) {

            loadOlderMessages();
        }
    };


    // =====================================================
    // LAYOUT AFTER MESSAGES UPDATE
    // =====================================================

    useLayoutEffect(() => {

        const container = messagesContainerRef.current;

        if (!container) {
            return;
        }


        if (!messages.length) {

            container.scrollTop = 0;

            return;
        }


        // =================================================
        // ВОССТАНОВЛЕНИЕ ПОЗИЦИИ ПОСЛЕ ЗАГРУЗКИ СТАРЫХ
        // =================================================

        const previousScroll = previousScrollHeightRef.current;


        if (previousScroll && typeof previousScroll === "object") {

            const newScrollHeight = container.scrollHeight;


            const heightDifference = newScrollHeight - previousScroll.height;


            container.scrollTop = previousScroll.top + heightDifference;


            previousScrollHeightRef.current = null;


            return;
        }


        // =================================================
        // ОТКРЫТИЕ НОВОГО ЧАТА
        // =================================================

        if (!loadingMessages && isOpeningChatRef.current) {

            container.scrollTop = container.scrollHeight;


            requestAnimationFrame(() => {

                container.scrollTop = container.scrollHeight;


                requestAnimationFrame(() => {

                    container.scrollTop = container.scrollHeight;

                    isOpeningChatRef.current = false;

                });

            });


            return;
        }


        // =================================================
        // НОВОЕ СООБЩЕНИЕ
        // =================================================

        if (!loadingMessages && shouldScrollToBottomRef.current) {

            requestAnimationFrame(() => {

                container.scrollTop = container.scrollHeight;

            });
        }

    }, [messages, loadingMessages]);


    // =====================================================
    // CREATE CHAT
    // =====================================================

    const createChat = async (username) => {

        const target = username?.trim();

        if (!target) {
            return;
        }


        if (currentUsername && target.toLowerCase() === currentUsername.toLowerCase()) {

            setError("Нельзя создать чат с самим собой");

            return;
        }


        try {

            setError("");


            const response = await messengerApi.post("/api/chats", {
                username: target
            });


            const newChat = response.data;


            setChats(previous => {

                const exists = previous.some(chat => chat.id === newChat.id);


                let updated;


                if (exists) {

                    updated = previous.map(chat => chat.id === newChat.id ? newChat : chat);

                } else {

                    updated = [newChat, ...previous];
                }


                chatsRef.current = updated;


                return updated;
            });


            setSelectedChat(newChat);

            selectedChatRef.current = newChat;


            // =================================================
            // RESET PAGINATION
            // =================================================

            setHasMoreMessages(true);

            oldestMessageIdRef.current = null;


            isOpeningChatRef.current = true;

            shouldScrollToBottomRef.current = true;


            setMessages([]);

            setLoadingMessages(true);


            try {

                const responseMessages = await messengerApi.get(`/api/messages/chat/${newChat.id}`, {
                    params: {
                        limit: 50
                    }
                });


                const loadedMessages = Array.isArray(responseMessages.data) ? responseMessages.data : [];


                setMessages(loadedMessages);


                if (loadedMessages.length < 50) {

                    setHasMoreMessages(false);

                } else {

                    setHasMoreMessages(true);
                }


                if (loadedMessages.length) {

                    oldestMessageIdRef.current = loadedMessages[0].id;
                }

            } catch (messageError) {

                console.error("Ошибка загрузки сообщений:", messageError);

                setMessages([]);

                setHasMoreMessages(false);

            } finally {

                setLoadingMessages(false);
            }


        } catch (err) {

            console.error("Ошибка создания чата:", err);

            setError(err.response?.data?.message || "Не удалось создать чат");
        }
    };


    // =====================================================
    // SELECT CHAT
    // =====================================================

    const selectChat = async (chat) => {

        if (!chat) {
            return;
        }


        setSelectedChat(chat);

        selectedChatRef.current = chat;


        setError("");

        setLoadingMessages(true);

        setLoadingOlderMessages(false);

        loadingOlderMessagesRef.current = false;


        // =================================================
        // RESET PAGINATION
        // =================================================

        setHasMoreMessages(true);

        oldestMessageIdRef.current = null;

        previousScrollHeightRef.current = null;


        /*
         * Открывается новый чат.
         */

        isOpeningChatRef.current = true;

        shouldScrollToBottomRef.current = true;


        /*
         * Очищаем старые сообщения.
         */

        setMessages([]);


        try {

            // =============================================
            // LOAD LAST 50
            // =============================================

            const response = await messengerApi.get(`/api/messages/chat/${chat.id}`, {
                params: {
                    limit: 50
                }
            });


            const loadedMessages = Array.isArray(response.data) ? response.data : [];


            setMessages(loadedMessages);


            // =============================================
            // PAGINATION STATE
            // =============================================

            if (loadedMessages.length < 50) {

                setHasMoreMessages(false);

            } else {

                setHasMoreMessages(true);
            }


            if (loadedMessages.length) {

                oldestMessageIdRef.current = loadedMessages[0].id;
            }


            // =============================================
            // MARK AS READ
            // =============================================

            await messengerApi.put(`/api/messages/chat/${chat.id}/read`);


            // =============================================
            // RESET UNREAD
            // =============================================

            setChats(previous => {

                const updated = previous.map(item => item.id === chat.id ? {
                    ...item, unreadCount: 0
                } : item);


                chatsRef.current = updated;


                return updated;
            });


        } catch (err) {

            console.error("Ошибка загрузки сообщений:", err);


            setMessages([]);

            setHasMoreMessages(false);


            setError(err.response?.data?.message || "Не удалось загрузить сообщения");

        } finally {

            setLoadingMessages(false);
        }
    };


    // =====================================================
    // SEND MESSAGE
    // =====================================================

    const sendMessage = () => {

        if (!content.trim() || !selectedChat) {
            return;
        }


        const recipient = getOtherUsername(selectedChat);


        if (!recipient) {

            setError("Не удалось определить получателя");

            return;
        }


        shouldScrollToBottomRef.current = true;


        const success = sendChatMessage(recipient, content.trim());


        if (!success) {

            setError("WebSocket не подключен");

            return;
        }


        setContent("");

        setError("");
    };


    // =====================================================
    // ENTER
    // =====================================================

    const handleKeyDown = (event) => {

        if (event.key === "Enter" && !event.shiftKey) {

            event.preventDefault();

            sendMessage();
        }
    };


    // =====================================================
    // FORMAT TIME
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


    // =====================================================
    // SELECTED CHAT DATA
    // =====================================================

    const selectedUsername = getOtherUsername(selectedChat);


    const selectedAvatar = getOtherAvatar(selectedChat);


    const selectedAvatarUrl = getAvatarUrl(selectedAvatar);


    const currentAvatarUrl = getAvatarUrl(currentUser?.avatar);


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="messenger-page">

            <div className="messenger-container">

                <ChatSidebar
                    chats={chats}
                    currentUsername={currentUsername}
                    selectedChat={selectedChat}
                    onSelectChat={selectChat}
                    onCreateChat={createChat}
                    error={error}
                />


                {/* =================================================
                    CHAT
                ================================================= */}

                <main className="messenger-chat">

                    {!selectedChat ? (

                        <div className="no-chat">

                            <div className="no-chat-icon">
                                💬
                            </div>

                            <h2>
                                Добро пожаловать в Messenger
                            </h2>

                            <p>
                                Выберите чат слева
                                или создайте новый
                            </p>

                        </div>

                    ) : (

                        <>

                            {/* =================================
                                HEADER
                            ================================= */}

                            <header className="chat-header">

                                <div className="chat-avatar chat-avatar-header">

                                    {selectedAvatarUrl ? (

                                        <img
                                            src={selectedAvatarUrl}
                                            alt={selectedUsername || "Avatar"}
                                            onError={event => {

                                                console.error("Не удалось загрузить аватар:", selectedAvatarUrl);

                                                event.currentTarget.style.display = "none";

                                                const parent = event.currentTarget.parentElement;

                                                if (parent) {

                                                    parent.classList.add("avatar-error");
                                                }
                                            }}
                                        />

                                    ) : (

                                        <span>
                                            {getAvatarLetter(selectedUsername)}
                                        </span>

                                    )}

                                </div>


                                <div className="chat-header-info">

                                    <h2>
                                        {selectedUsername || "Пользователь"}
                                    </h2>

                                    <span>
                                        В сети
                                    </span>

                                </div>

                            </header>


                            {/* =================================
                                MESSAGES
                            ================================= */}

                            <div
                                className="messages-container"
                                ref={messagesContainerRef}
                                onScroll={handleMessagesScroll}
                            >

                                {/* =================================
                                    LOADING OLDER
                                ================================= */}

                                {loadingOlderMessages && (

                                    <div className="messages-loading older-messages-loading">

                                        Загрузка старых сообщений...

                                    </div>

                                )}


                                {loadingMessages ? (

                                    <div className="messages-loading">

                                        Загрузка сообщений...

                                    </div>

                                ) : messages.length === 0 ? (

                                    <div className="no-messages">

                                        <div>
                                            👋
                                        </div>

                                        <p>
                                            Сообщений пока нет
                                        </p>

                                        <span>
                                            Напишите первое сообщение
                                        </span>

                                    </div>

                                ) : (

                                    messages.map(message => {

                                        const own = message.senderUsername && currentUsername && message.senderUsername
                                            .toLowerCase() === currentUsername
                                            .toLowerCase();


                                        return (

                                            <div
                                                key={message.id}
                                                className={`message-row ${own ? "own" : "other"}`}
                                            >

                                                <div className="message-bubble">

                                                    {!own && (

                                                        <div className="message-sender">

                                                            {message.senderUsername || "Пользователь"}

                                                        </div>

                                                    )}


                                                    <div className="message-content">

                                                        {message.content}

                                                    </div>


                                                    <div className="message-time">

                                                        {formatTime(message.createdAt)}


                                                        {own && (

                                                            <span
                                                                className={`message-read-status ${message.read ? "read" : ""}`}
                                                            >

                                                                    {message.read ? "✓✓" : "✓"}

                                                                </span>

                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                        );

                                    })

                                )}

                            </div>


                            {/* =================================
                                INPUT
                            ================================= */}

                            <div className="message-input-container">

                                <textarea
                                    value={content}
                                    onChange={event => setContent(event.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Напишите сообщение..."
                                    rows="1"
                                />


                                <button
                                    onClick={sendMessage}
                                    disabled={!content.trim()}
                                >
                                    ➤
                                </button>

                            </div>

                        </>

                    )}

                </main>

            </div>

        </div>);
}


export default MessengerPage;