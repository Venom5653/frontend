import {Client} from "@stomp/stompjs";

let stompClient = null;
let messageSubscription = null;
let currentMessageHandler = null;
let reconnectPromise = null;
let readSubscription = null;
let currentReadHandler = null;
let statusSubscription = null;
let currentStatusHandler = null;
let notificationClient = null;
let notificationSubscription = null;
let currentNotificationHandler = null;
let deletedSubscription = null;
let currentDeletedHandler = null;

export function subscribeToReadEvents(onRead) {
    currentReadHandler = onRead;
    if (!stompClient) {
        console.log("STOMP client ещё не создан. " + "Подписка read будет создана после подключения.");
        return;
    }
    if (!stompClient.connected) {
        console.log("STOMP client ещё не подключен.");
        return;
    }
    if (readSubscription) {
        console.log("Подписка на read уже существует");
        return;
    }
    readSubscription = stompClient.subscribe("/user/queue/message-read", message => {
        try {
            const event = JSON.parse(message.body);
            if (currentReadHandler) {
                currentReadHandler(event);
            }
        } catch (error) {

            console.error("Ошибка обработки MESSAGE_READ:", error);

        }

    });


    console.log("Подписка /user/queue/message-read создана");
}


// =====================================================
// USER STATUS
// =====================================================

export function subscribeToUserStatus(onStatus) {

    currentStatusHandler = onStatus;


    if (!stompClient) {

        console.log(
            "STOMP client ещё не создан. " +
            "Подписка на статус будет создана после подключения."
        );

        return () => {};

    }


    if (!stompClient.connected) {

        console.log(
            "STOMP client ещё не подключен. " +
            "Подписка на статус будет создана после подключения."
        );

        return () => {};

    }


    if (statusSubscription) {

        console.log("Подписка на статусы уже существует");

        return () => {};

    }


    const subscription = stompClient.subscribe(
        "/topic/user-status",
        message => {

            try {

                const event = JSON.parse(message.body);

                console.log("USER STATUS:", event);


                if (currentStatusHandler) {

                    currentStatusHandler(event);

                }

            } catch (error) {

                console.error(
                    "Ошибка обработки USER STATUS:",
                    error
                );

            }

        }
    );


    statusSubscription = subscription;


    console.log(
        "Подписка /topic/user-status создана"
    );


    return () => {

        try {

            subscription.unsubscribe();

        } catch (error) {

            console.error(
                "WebSocket: ошибка unsubscribe status:",
                error
            );

        }


        if (statusSubscription === subscription) {

            statusSubscription = null;

        }

    };

}


// =====================================================
// CONNECT WEBSOCKET
// =====================================================

export function connectWebSocket(token, onConnected) {

    if (!token) {

        console.error("WebSocket: JWT отсутствует");

        return;
    }


    if (stompClient && stompClient.connected) {

        console.log("WebSocket уже подключен");


        if (onConnected) {

            onConnected();

        }


        return;
    }


    if (stompClient && !stompClient.connected) {

        console.log("WebSocket: клиент уже существует");

        return;
    }


    console.log("WebSocket: создаём новое соединение");


    stompClient = new Client({

        brokerURL: import.meta.env.VITE_WS_URL,


        connectHeaders: {

            Authorization: `Bearer ${token}`

        },


        reconnectDelay: 5000,


        heartbeatIncoming: 10000,

        heartbeatOutgoing: 10000,


        debug: message => {

            console.log("STOMP:", message);

        },


        onConnect: () => {

            console.log("========== WS CONNECTED ==========");


            console.log("STOMP connected:", stompClient.connected);

            subscribeToMessages(currentMessageHandler);
            subscribeToReadEvents(currentReadHandler);
            subscribeToUserStatus(currentStatusHandler);
            subscribeToDeletedEvents(currentDeletedHandler);

            if (onConnected) {

                onConnected();

            }

        },


        onStompError: frame => {

            console.error("STOMP error:", frame);

        },


        onWebSocketError: error => {

            console.error("WebSocket error:", error);

        },


        onDisconnect: () => {

            console.log("WebSocket отключен");

        }

    });


    stompClient.activate();
}


// =====================================================
// SEND CHAT MESSAGE
// =====================================================

export function sendChatMessage(chatId, content) {

    // -------------------------------------------------
    // CHAT ID
    // -------------------------------------------------

    if (!chatId) {

        console.error("WebSocket: chatId отсутствует");

        return false;
    }


    // -------------------------------------------------
    // CONTENT
    // -------------------------------------------------

    if (!content) {

        console.error("WebSocket: content отсутствует");

        return false;
    }


    // -------------------------------------------------
    // CLIENT
    // -------------------------------------------------

    if (!stompClient) {

        console.error("STOMP client не существует");

        return false;
    }


    // -------------------------------------------------
    // CONNECTION
    // -------------------------------------------------

    if (!stompClient.connected) {

        console.error("STOMP client ещё не подключен");

        return false;
    }


    // -------------------------------------------------
    // PUBLISH
    // -------------------------------------------------

    try {

        stompClient.publish({

            destination: "/app/chat",


            body: JSON.stringify({

                chatId: Number(chatId),

                content

            })

        });


        console.log("WebSocket сообщение отправлено:", {
            chatId, content
        });


        return true;

    } catch (error) {

        console.error("WebSocket: ошибка отправки сообщения:", error);


        return false;

    }
}


// =====================================================
// SUBSCRIBE TO MESSAGES
// =====================================================

export function subscribeToMessages(onMessage) {

    currentMessageHandler = onMessage;


    if (!stompClient) {

        console.log("STOMP client ещё не создан. " + "Подписка будет создана после подключения.");

        return;
    }


    if (!stompClient.connected) {

        console.log("STOMP client ещё не подключен.");

        return;
    }


    if (messageSubscription) {

        console.log("Подписка уже существует");

        return;
    }


    messageSubscription = stompClient.subscribe("/user/queue/messages", message => {

        try {

            const body = JSON.parse(message.body);


            if (currentMessageHandler) {

                currentMessageHandler(body);

            }

        } catch (error) {

            console.error("Ошибка обработки " + "WebSocket сообщения:", error);

        }

    });
}
export function sendMessage(chatId, content) {
    return sendChatMessage(chatId, content);
}

export async function reconnectWebSocket(newToken) {
    if (!newToken) {
        console.error("WebSocket: новый JWT отсутствует");
        return;
    }
    if (reconnectPromise) {
        console.log("WebSocket: переподключение уже выполняется");
        return reconnectPromise;
    }
    reconnectPromise = (async () => {
        console.log("WebSocket: переподключение с новым JWT");
        const handler = currentMessageHandler;
        const readHandler = currentReadHandler;
        const deletedHandler = currentDeletedHandler;
        const statusHandler = currentStatusHandler;

        if (messageSubscription) {
            try {
                messageSubscription.unsubscribe();
            } catch (error) {
                console.error("WebSocket: ошибка unsubscribe:", error);
            }
            messageSubscription = null;
        }
        if (readSubscription) {
            try {
                readSubscription.unsubscribe();
            } catch (error) {
                console.error("WebSocket: ошибка unsubscribe read:", error);
            }
            readSubscription = null;
        }
        if (statusSubscription) {
            try {
                statusSubscription.unsubscribe();
            } catch (error) {
                console.error("WebSocket: ошибка unsubscribe status:", error);
            }
            statusSubscription = null;
        }

        if (deletedSubscription) {
            try {
                deletedSubscription.unsubscribe();
            } catch (error) {
                console.error("WebSocket: ошибка unsubscribe delete:", error);
            }
            deletedSubscription = null;
        }

        if (stompClient) {
            try {
                await stompClient.deactivate();
            } catch (error) {
                console.error("WebSocket: ошибка отключения:", error);
            }
        }
        stompClient = null;
        currentMessageHandler = handler;
        currentReadHandler = readHandler;
        currentDeletedHandler = deletedHandler;
        currentStatusHandler = statusHandler;
        connectWebSocket(newToken, () => {

            console.log("WebSocket: успешно переподключён");

        });

    })().finally(() => {

        reconnectPromise = null;

    });


    return reconnectPromise;
}


export async function disconnectWebSocket() {
    if (messageSubscription) {

        try {

            messageSubscription.unsubscribe();

        } catch (error) {

            console.error("WebSocket: ошибка unsubscribe:", error);

        }
        messageSubscription = null;
    }
    if (readSubscription) {
        try {
            readSubscription.unsubscribe();
        } catch (error) {
            console.error("WebSocket: ошибка unsubscribe read:", error);
        }
        readSubscription = null;
    }

    if (statusSubscription) {
        try {
            statusSubscription.unsubscribe();
        } catch (error) {
            console.error("WebSocket: ошибка unsubscribe status:", error);
        }
        statusSubscription = null;
    }
    if (deletedSubscription) {
        try {
            deletedSubscription.unsubscribe();
        } catch (error) {
            console.error("WebSocket: ошибка unsubscribe delete:", error);
        }

        deletedSubscription = null;
    }

    currentDeletedHandler = null;
    currentMessageHandler = null;
    currentReadHandler = null;
    currentStatusHandler = null;
    if (stompClient) {

        try {

            await stompClient.deactivate();

        } catch (error) {

            console.error("WebSocket: ошибка disconnect:", error);

        }

    }


    stompClient = null;

    reconnectPromise = null;


    console.log("WebSocket отключен");
}
export function openChat(chatId) {

    if (!chatId) {

        console.warn("CHAT OPEN: chatId отсутствует");

        return false;
    }
    if (!stompClient || !stompClient.connected) {
        console.warn("CHAT OPEN: WebSocket не подключен");
        return false;
    }
    stompClient.publish({
        destination: "/app/chat/open",
        body: JSON.stringify({
            chatId: Number(chatId)
        })
    });
    console.log("CHAT OPEN:", chatId);
    return true;
}

export function closeChat() {

    if (!stompClient || !stompClient.connected) {

        return false;
    }
    stompClient.publish({
        destination: "/app/chat/close",
        body: "{}"
    });
    console.log("CHAT CLOSE");
    return true;
}

export function connectNotificationWebSocket(token, onNotification) {

    if (!token) {

        console.error("Notification WebSocket: JWT отсутствует");

        return;
    }


    currentNotificationHandler = onNotification;


    if (notificationClient && notificationClient.connected) {

        console.log("Notification WebSocket уже подключен");

        return;
    }


    console.log("Notification WebSocket: создаём соединение");


    notificationClient = new Client({

        brokerURL: import.meta.env.VITE_NOTIFICATION_WS_URL,


        connectHeaders: {

            Authorization: `Bearer ${token}`

        },


        reconnectDelay: 5000,


        heartbeatIncoming: 10000,

        heartbeatOutgoing: 10000,


        debug: message => {

            console.log("NOTIFICATION STOMP:", message);

        },


        onConnect: () => {

            console.log("========== NOTIFICATION WS CONNECTED ==========");


            notificationSubscription = notificationClient.subscribe("/user/queue/notifications",

                message => {

                    try {
                        console.log("RAW NOTIFICATION WS MESSAGE:", message.body);

                        const notification = JSON.parse(message.body);


                        console.log("NEW NOTIFICATION:", notification);


                        if (currentNotificationHandler) {

                            currentNotificationHandler(notification);

                        }

                    } catch (error) {

                        console.error("Ошибка обработки notification:", error);

                    }

                });


            console.log("Подписка /user/queue/notifications создана");

        },


        onStompError: frame => {

            console.error("Notification STOMP error:", frame);

        },


        onWebSocketError: error => {

            console.error("Notification WebSocket error:", error);

        },


        onDisconnect: () => {

            console.log("Notification WebSocket отключен");

        }

    });


    notificationClient.activate();
}

export function subscribeToDeletedEvents(onDeleted) {
    currentDeletedHandler = onDeleted;
    if (!stompClient) {
        console.log("STOMP client ещё не создан. Подписка delete будет создана после подключения.");
        return;
    }
    if (!stompClient.connected) {
        console.log("STOMP client ещё не подключен.");
        return;
    }
    if (deletedSubscription) {
        console.log("Подписка на delete уже существует");
        return;
    }
    deletedSubscription = stompClient.subscribe(
        "/user/queue/message-deleted",
        message => {
            try {
                const event = JSON.parse(message.body);
                if (currentDeletedHandler) {
                    currentDeletedHandler(event);
                }
            } catch (error) {
                console.error("Ошибка обработки MESSAGE_DELETED:", error);
            }
        }
    );
    console.log("Подписка /user/queue/message-deleted создана");
}

export async function disconnectNotificationWebSocket() {

    if (notificationSubscription) {

        try {

            notificationSubscription.unsubscribe();

        } catch (error) {

            console.error("Ошибка unsubscribe notification:", error);

        }


        notificationSubscription = null;

    }


    currentNotificationHandler = null;


    if (notificationClient) {

        try {

            await notificationClient.deactivate();

        } catch (error) {

            console.error("Ошибка отключения notification WebSocket:", error);

        }

    }


    notificationClient = null;


    console.log("Notification WebSocket отключен");
}