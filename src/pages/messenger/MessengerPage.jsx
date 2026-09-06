import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState
} from "react";

import {
    useOutletContext
} from "react-router-dom";

import ChatSidebar from "../../components/messenger/ChatSidebar.jsx";

import messengerApi from "../../api/messenger/messengerApi.js";

import {
    messageBelongsToChat
} from "../../utils/chatUtils.js";

import {
    connectWebSocket,
    disconnectWebSocket,
    sendChatMessage,
    subscribeToMessages,
    subscribeToReadEvents
} from "../../services/messenger/websocketService.js";

import {
    getOnlineUsers
} from "../../api/messenger/presenceApi.js";

import {
    createOnlineUsersSet,
    isUserOnline,
    subscribeToPresence
} from "../../services/messenger/presenceService.js";

import "./MessengerPage.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080";

const PAGE_SIZE = 50;

function MessengerPage() {

// =====================================================
// LAYOUT CONTEXT
// =====================================================

    const {
        setMobileChatOpen
    } = useOutletContext();


// =====================================================
// STATE
// =====================================================

    const [currentUser, setCurrentUser] = useState(null);

    const [chats, setChats] = useState([]);

    const [selectedChat, setSelectedChat] = useState(null);

    const [messages, setMessages] = useState([]);

    const [content, setContent] = useState("");

    const [error, setError] = useState("");

    const [loadingMessages, setLoadingMessages] = useState(false);

    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

    const [hasMoreMessages, setHasMoreMessages] = useState(true);

    const [onlineUsers, setOnlineUsers] = useState(new Set());

    const [selectedAvatarError, setSelectedAvatarError] = useState(false);


// =====================================================
// REFS
// =====================================================

    const messagesContainerRef = useRef(null);

    const chatsRef = useRef([]);

    const selectedChatRef = useRef(null);

    const shouldScrollToBottomRef = useRef(true);

    const isOpeningChatRef = useRef(false);

    const previousScrollRef = useRef(null);

    const loadingOlderMessagesRef = useRef(false);


// =====================================================
// CURRENT USERNAME
// =====================================================

    const currentUsername =
        currentUser?.username || null;


// =====================================================
// SYNC CHAT WITH LAYOUT
// =====================================================

    useEffect(() => {

        setMobileChatOpen(Boolean(selectedChat));


        return () => {

            setMobileChatOpen(false);

        };

    }, [
        selectedChat,
        setMobileChatOpen
    ]);


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


        if (
            value.startsWith("http://") ||
            value.startsWith("https://")
        ) {

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


        const user1 =
            chat.user1Username?.trim();

        const user2 =
            chat.user2Username?.trim();


        if (!currentUsername) {

            return user1 || user2 || null;

        }


        const normalizedCurrent =
            currentUsername
                .trim()
                .toLowerCase();


        if (
            user1 &&
            user1.toLowerCase() === normalizedCurrent
        ) {

            return user2 || null;

        }


        if (
            user2 &&
            user2.toLowerCase() === normalizedCurrent
        ) {

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


        const user1 =
            chat.user1Username?.trim();

        const user2 =
            chat.user2Username?.trim();


        if (!currentUsername) {

            return (
                chat.user1Avatar ||
                chat.user2Avatar ||
                null
            );

        }


        const normalizedCurrent =
            currentUsername
                .trim()
                .toLowerCase();


        if (
            user1 &&
            user1.toLowerCase() === normalizedCurrent
        ) {

            return chat.user2Avatar || null;

        }


        if (
            user2 &&
            user2.toLowerCase() === normalizedCurrent
        ) {

            return chat.user1Avatar || null;

        }


        return (
            chat.user1Avatar ||
            chat.user2Avatar ||
            null
        );

    };


// =====================================================
// LOAD CURRENT USER
// =====================================================

    const loadCurrentUser = async () => {

        try {

            const response =
                await messengerApi.get("/api/users/me");


            const user = response.data;


            setCurrentUser(user);


            if (user?.username) {

                localStorage.setItem(
                    "username",
                    user.username
                );

            }


            return user;

        } catch (error) {

            console.error(
                "Ошибка загрузки пользователя:",
                error
            );


            setError(
                "Не удалось определить текущего пользователя"
            );


            return null;

        }

    };


// =====================================================
// LOAD CHATS
// =====================================================

    const loadChats = async () => {

        try {

            const response =
                await messengerApi.get("/api/chats");


            const chatList =
                Array.isArray(response.data)
                    ? response.data
                    : [];


            setChats(chatList);

            chatsRef.current = chatList;


            return chatList;

        } catch (error) {

            console.error(
                "Ошибка загрузки чатов:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Не удалось загрузить чаты"
            );


            return [];

        }

    };


// =====================================================
// INITIALIZATION
// =====================================================

    useEffect(() => {

        const init = async () => {

            const user =
                await loadCurrentUser();


            if (!user) {
                return;
            }


            await loadChats();

        };


        init();

    }, []);


// =====================================================
// RESET AVATAR ERROR
// =====================================================

    useEffect(() => {

        setSelectedAvatarError(false);

    }, [selectedChat?.id]);


// =====================================================
// WEBSOCKET
// =====================================================

    useEffect(() => {

        if (!currentUsername) {
            return;
        }


        const token =
            localStorage.getItem("token");


        if (!token) {

            console.warn(
                "JWT token отсутствует"
            );

            return;

        }


        connectWebSocket(
            token,
            async () => {


                // =========================================
                // NEW MESSAGE
                // =========================================

                subscribeToMessages(async (message) => {

                    const currentChats =
                        chatsRef.current;

                    const currentChat =
                        selectedChatRef.current;


                    const messageChat =
                        currentChats.find(
                            chat =>
                                messageBelongsToChat(
                                    message,
                                    chat
                                )
                        );


                    const isCurrentChat =
                        currentChat &&
                        messageBelongsToChat(
                            message,
                            currentChat
                        );


                    const isOwn =
                        message.senderUsername &&
                        currentUsername &&
                        message.senderUsername
                            .toLowerCase() ===
                        currentUsername
                            .toLowerCase();


                    // =====================================
                    // ADD MESSAGE
                    // =====================================

                    if (isCurrentChat) {

                        shouldScrollToBottomRef.current = true;


                        setMessages(previous => {

                            const exists =
                                previous.some(
                                    item =>
                                        item.id ===
                                        message.id
                                );


                            if (exists) {
                                return previous;
                            }


                            return [
                                ...previous,
                                message
                            ];

                        });


                        if (message.chatId) {

                            try {

                                await messengerApi.put(
                                    `/api/messages/chat/${message.chatId}/read`
                                );

                            } catch (error) {

                                console.error(
                                    "Ошибка отметки сообщений прочитанными:",
                                    error
                                );

                            }

                        }

                    }


                    // =====================================
                    // UPDATE CHAT LIST
                    // =====================================

                    if (messageChat) {

                        setChats(previous => {

                            const updated =
                                previous.map(chat => {

                                    if (
                                        chat.id !==
                                        messageChat.id
                                    ) {

                                        return chat;

                                    }


                                    const unread =
                                        Number(
                                            chat.unreadCount || 0
                                        );


                                    return {

                                        ...chat,

                                        lastMessage:
                                        message.content,

                                        lastMessageCreatedAt:
                                        message.createdAt,

                                        unreadCount:
                                            isCurrentChat || isOwn
                                                ? 0
                                                : unread + 1

                                    };

                                });


                            updated.sort(
                                (a, b) =>
                                    new Date(
                                        b.lastMessageCreatedAt ||
                                        b.createdAt
                                    ) -
                                    new Date(
                                        a.lastMessageCreatedAt ||
                                        a.createdAt
                                    )
                            );


                            chatsRef.current = updated;


                            return updated;

                        });

                    } else {

                        await loadChats();

                    }

                });


                // =========================================
                // READ EVENTS
                // =========================================

                subscribeToReadEvents(event => {

                    setMessages(previous =>
                        previous.map(message => {

                            if (
                                message.id ===
                                event.messageId
                            ) {

                                return {
                                    ...message,
                                    read: true
                                };

                            }


                            return message;

                        })
                    );

                });


                // =========================================
                // PRESENCE
                // =========================================

                subscribeToPresence(
                    ({username, online}) => {

                        if (!username) {
                            return;
                        }


                        setOnlineUsers(previous => {

                            const next =
                                new Set(previous);


                            const normalized =
                                username
                                    .trim()
                                    .toLowerCase();


                            if (online) {

                                next.add(normalized);

                            } else {

                                next.delete(normalized);

                            }


                            return next;

                        });

                    }
                );


                // =========================================
                // INITIAL PRESENCE
                // =========================================

                try {

                    const users =
                        await getOnlineUsers();


                    setOnlineUsers(
                        createOnlineUsersSet(users)
                    );

                } catch (error) {

                    console.error(
                        "Ошибка загрузки presence:",
                        error
                    );

                }

            }
        );


        return () => {

            disconnectWebSocket();

        };

    }, [currentUsername]);


// =====================================================
// SYNC REFS
// =====================================================

    useEffect(() => {

        chatsRef.current = chats;

    }, [chats]);


    useEffect(() => {

        selectedChatRef.current =
            selectedChat;

    }, [selectedChat]);


// =====================================================
// CHECK SCROLL POSITION
// =====================================================

    const checkIfNearBottom = () => {

        const container =
            messagesContainerRef.current;


        if (!container) {
            return;
        }


        const distanceFromBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight;


        shouldScrollToBottomRef.current =
            distanceFromBottom <= 150;

    };


// =====================================================
// LOAD OLDER MESSAGES
// =====================================================

    const loadOlderMessages = async () => {

        if (
            loadingOlderMessagesRef.current ||
            !selectedChat ||
            !messages.length ||
            !hasMoreMessages
        ) {

            return;

        }


        const oldestMessage =
            messages[0];


        if (!oldestMessage?.id) {
            return;
        }


        const container =
            messagesContainerRef.current;


        if (!container) {
            return;
        }


        loadingOlderMessagesRef.current = true;

        setLoadingOlderMessages(true);


        const previousScroll = {

            height: container.scrollHeight,

            top: container.scrollTop

        };


        try {

            const response =
                await messengerApi.get(
                    `/api/messages/chat/${selectedChat.id}`,
                    {
                        params: {
                            beforeId: oldestMessage.id,
                            limit: PAGE_SIZE
                        }
                    }
                );


            const olderMessages =
                Array.isArray(response.data)
                    ? response.data
                    : [];


            if (!olderMessages.length) {

                setHasMoreMessages(false);

                return;

            }


            setMessages(previous => {

                const existingIds =
                    new Set(
                        previous.map(
                            message => message.id
                        )
                    );


                const uniqueOlderMessages =
                    olderMessages.filter(
                        message =>
                            !existingIds.has(message.id)
                    );


                if (!uniqueOlderMessages.length) {

                    return previous;

                }


                previousScrollRef.current =
                    previousScroll;


                return [
                    ...uniqueOlderMessages,
                    ...previous
                ];

            });


            if (
                olderMessages.length <
                PAGE_SIZE
            ) {

                setHasMoreMessages(false);

            }

        } catch (error) {

            console.error(
                "Ошибка загрузки старых сообщений:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Не удалось загрузить старые сообщения"
            );

        } finally {

            setLoadingOlderMessages(false);

            loadingOlderMessagesRef.current = false;

        }

    };


// =====================================================
// SCROLL
// =====================================================

    const handleMessagesScroll = () => {

        const container =
            messagesContainerRef.current;


        if (!container) {
            return;
        }


        checkIfNearBottom();


        if (
            container.scrollTop <= 100 &&
            !loadingOlderMessagesRef.current &&
            hasMoreMessages
        ) {

            loadOlderMessages();

        }

    };


// =====================================================
// LAYOUT AFTER UPDATE
// =====================================================

    useLayoutEffect(() => {

        const container =
            messagesContainerRef.current;


        if (!container) {
            return;
        }


        if (!messages.length) {

            container.scrollTop = 0;

            return;

        }


        // =============================================
        // RESTORE SCROLL
        // =============================================

        const previousScroll =
            previousScrollRef.current;


        if (previousScroll) {

            const heightDifference =
                container.scrollHeight -
                previousScroll.height;


            container.scrollTop =
                previousScroll.top +
                heightDifference;


            previousScrollRef.current = null;

            return;

        }


        // =============================================
        // OPEN CHAT
        // =============================================

        if (
            !loadingMessages &&
            isOpeningChatRef.current
        ) {

            requestAnimationFrame(() => {

                container.scrollTop =
                    container.scrollHeight;


                requestAnimationFrame(() => {

                    container.scrollTop =
                        container.scrollHeight;


                    isOpeningChatRef.current = false;

                });

            });


            return;

        }


        // =============================================
        // NEW MESSAGE
        // =============================================

        if (
            !loadingMessages &&
            shouldScrollToBottomRef.current
        ) {

            requestAnimationFrame(() => {

                container.scrollTop =
                    container.scrollHeight;

            });

        }

    }, [
        messages,
        loadingMessages
    ]);


// =====================================================
// LOAD CHAT MESSAGES
// =====================================================

    const loadChatMessages = async (chat) => {

        setLoadingMessages(true);

        setHasMoreMessages(true);

        previousScrollRef.current = null;

        isOpeningChatRef.current = true;

        shouldScrollToBottomRef.current = true;

        setMessages([]);


        try {

            const response =
                await messengerApi.get(
                    `/api/messages/chat/${chat.id}`,
                    {
                        params: {
                            limit: PAGE_SIZE
                        }
                    }
                );


            const loadedMessages =
                Array.isArray(response.data)
                    ? response.data
                    : [];


            setMessages(loadedMessages);


            setHasMoreMessages(
                loadedMessages.length ===
                PAGE_SIZE
            );


            await messengerApi.put(
                `/api/messages/chat/${chat.id}/read`
            );


            setChats(previous => {

                const updated =
                    previous.map(item =>
                        item.id === chat.id
                            ? {
                                ...item,
                                unreadCount: 0
                            }
                            : item
                    );


                chatsRef.current = updated;


                return updated;

            });

        } catch (error) {

            console.error(
                "Ошибка загрузки сообщений:",
                error
            );


            setMessages([]);

            setHasMoreMessages(false);


            setError(
                error.response?.data?.message ||
                "Не удалось загрузить сообщения"
            );

        } finally {

            setLoadingMessages(false);

        }

    };


// =====================================================
// CREATE CHAT
// =====================================================

    const createChat = async (username) => {

        const target =
            username?.trim();


        if (!target) {
            return;
        }


        if (
            currentUsername &&
            target.toLowerCase() ===
            currentUsername.toLowerCase()
        ) {

            setError(
                "Нельзя создать чат с самим собой"
            );

            return;

        }


        try {

            setError("");


            const response =
                await messengerApi.post(
                    "/api/chats",
                    {
                        username: target
                    }
                );


            const newChat =
                response.data;


            setChats(previous => {

                const exists =
                    previous.some(
                        chat =>
                            chat.id ===
                            newChat.id
                    );


                const updated =
                    exists
                        ? previous.map(chat =>
                            chat.id === newChat.id
                                ? newChat
                                : chat
                        )
                        : [
                            newChat,
                            ...previous
                        ];


                chatsRef.current = updated;


                return updated;

            });


            setSelectedChat(newChat);

            selectedChatRef.current =
                newChat;


            await loadChatMessages(newChat);

        } catch (error) {

            console.error(
                "Ошибка создания чата:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Не удалось создать чат"
            );

        }

    };


// =====================================================
// SELECT CHAT
// =====================================================

    const selectChat = async (chat) => {

        if (!chat) {
            return;
        }


        setError("");


        setSelectedChat(chat);

        selectedChatRef.current =
            chat;


        await loadChatMessages(chat);

    };


// =====================================================
// CLOSE CHAT
// =====================================================

    const closeMobileChat = () => {

        setSelectedChat(null);

        selectedChatRef.current = null;

        setMessages([]);

        setContent("");

        setError("");

        setMobileChatOpen(false);

    };


// =====================================================
// SEND MESSAGE
// =====================================================

    const sendMessage = () => {

        const text =
            content.trim();


        if (!text || !selectedChat) {
            return;
        }


        const recipient =
            getOtherUsername(selectedChat);


        if (!recipient) {

            setError(
                "Не удалось определить получателя"
            );

            return;

        }


        shouldScrollToBottomRef.current = true;


        const success =
            sendChatMessage(
                recipient,
                text
            );


        if (!success) {

            setError(
                "WebSocket не подключен"
            );

            return;

        }


        setContent("");

        setError("");

    };


// =====================================================
// ENTER
// =====================================================

    const handleKeyDown = (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

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


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return "";

        }


        return parsed.toLocaleTimeString(
            "ru-RU",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    };


// =====================================================
// SELECTED CHAT DATA
// =====================================================

    const selectedUsername =
        getOtherUsername(selectedChat);


    const selectedAvatar =
        getOtherAvatar(selectedChat);


    const selectedAvatarUrl =
        getAvatarUrl(selectedAvatar);


// =====================================================
// RENDER
// =====================================================

    return (

        <div className="messenger-page">

            <div
                className={`messenger-container ${
                    selectedChat ? "mobile-chat-open" : ""
                }`}
            >


                {/* =========================================
                SIDEBAR
            ========================================= */}

                <ChatSidebar
                    chats={chats}
                    currentUsername={currentUsername}
                    selectedChat={selectedChat}
                    onSelectChat={selectChat}
                    onCreateChat={createChat}
                    error={error}
                />


                {/* =========================================
                CHAT
            ========================================= */}

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


                                <button
                                    type="button"
                                    className="mobile-back-button"
                                    onClick={closeMobileChat}
                                    aria-label="Назад к чатам"
                                >
                                    ←
                                </button>


                                {/* AVATAR */}

                                <div className="chat-avatar-header">

                                    {selectedAvatarUrl &&
                                    !selectedAvatarError ? (

                                        <img
                                            src={selectedAvatarUrl}
                                            alt={
                                                selectedUsername ||
                                                "Avatar"
                                            }
                                            onError={() =>
                                                setSelectedAvatarError(true)
                                            }
                                        />

                                    ) : (

                                        <span>

                                        {getAvatarLetter(
                                            selectedUsername
                                        )}

                                    </span>

                                    )}

                                </div>


                                {/* INFO */}

                                <div className="chat-header-info">

                                    <h2>

                                        {selectedUsername ||
                                            "Пользователь"}

                                    </h2>

                                    <span>

                                    {isUserOnline(
                                        onlineUsers,
                                        selectedUsername
                                    )
                                        ? "В сети"
                                        : "Не в сети"}

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


                                {loadingOlderMessages && (

                                    <div className="older-messages-loading">

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

                                        const own =
                                            message.senderUsername &&
                                            currentUsername &&
                                            message.senderUsername
                                                .toLowerCase() ===
                                            currentUsername
                                                .toLowerCase();


                                        return (

                                            <div
                                                key={message.id}
                                                className={
                                                    `message-row ${
                                                        own
                                                            ? "own"
                                                            : "other"
                                                    }`
                                                }
                                            >

                                                <div className="message-bubble">


                                                    {!own && (

                                                        <div className="message-sender">

                                                            {message.senderUsername ||
                                                                "Пользователь"}

                                                        </div>

                                                    )}


                                                    <div className="message-content">

                                                        {message.content}

                                                    </div>


                                                    <div className="message-time">

                                                        {formatTime(
                                                            message.createdAt
                                                        )}


                                                        {own && (

                                                            <span
                                                                className={
                                                                    `message-read-status ${
                                                                        message.read
                                                                            ? "read"
                                                                            : ""
                                                                    }`
                                                                }
                                                            >

                                                            {message.read
                                                                ? "✓✓"
                                                                : "✓"}

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
                                onChange={event =>
                                    setContent(
                                        event.target.value
                                    )
                                }
                                onKeyDown={handleKeyDown}
                                placeholder="Напишите сообщение..."
                                rows="1"
                            />


                                <button
                                    type="button"
                                    onClick={sendMessage}
                                    disabled={!content.trim()}
                                    aria-label="Отправить сообщение"
                                >
                                    ➤
                                </button>

                            </div>

                        </>

                    )}

                </main>

            </div>

        </div>

    );


}

export default MessengerPage;
