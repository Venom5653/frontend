import {Client} from "@stomp/stompjs";

let stompClient = null;
let messageSubscription = null;
let currentMessageHandler = null;
let reconnectPromise = null;
let readSubscription = null;
let currentReadHandler = null;
let statusSubscription = null;
let currentStatusHandler = null;

export function subscribeToReadEvents(onRead) {

    currentReadHandler = onRead;

    if (!stompClient) {
        console.error("STOMP client не существует");
        return;
    }

    if (!stompClient.connected) {
        console.error("STOMP client ещё не подключен");
        return;
    }

    if (readSubscription) {
        console.log("Подписка на read уже существует");
        return;
    }

    readSubscription = stompClient.subscribe("/user/queue/message-read", message => {

        try {

            const event = JSON.parse(message.body);

            console.log("MESSAGE_READ:", event);

            if (currentReadHandler) {
                currentReadHandler(event);
            }

        } catch (error) {

            console.error("Ошибка обработки MESSAGE_READ:", error);
        }
    });

    console.log("Подписка /user/queue/message-read создана");
}

export function subscribeToUserStatus(onStatus) {

    currentStatusHandler = onStatus;

    if (!stompClient) {
        console.error("STOMP client не существует");
        return;
    }

    if (!stompClient.connected) {
        console.error("STOMP client ещё не подключен");
        return;
    }

    if (statusSubscription) {
        console.log("Подписка на статусы уже существует");
        return;
    }

    statusSubscription = stompClient.subscribe("/topic/user-status", message => {

        try {

            const event = JSON.parse(message.body);

            console.log("USER STATUS:", event);

            if (currentStatusHandler) {
                currentStatusHandler(event);
            }

        } catch (error) {

            console.error("Ошибка обработки USER STATUS:", error);
        }
    });

    console.log("Подписка /topic/user-status создана");
}

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

            console.log("Username должен быть установлен сервером");

            subscribeToMessages(currentMessageHandler);

            subscribeToReadEvents(currentReadHandler);


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

export function sendChatMessage(recipientUsername, content) {

    if (!recipientUsername) {

        console.error("WebSocket: recipientUsername отсутствует");

        return false;
    }

    if (!content) {

        console.error("WebSocket: content отсутствует");

        return false;
    }

    if (!stompClient) {

        console.error("STOMP client не существует");

        return false;
    }

    if (!stompClient.connected) {

        console.error("STOMP client ещё не подключен");

        return false;
    }

    try {

        stompClient.publish({

            destination: "/app/chat",

            body: JSON.stringify({
                recipientUsername, content
            })
        });

        console.log("WebSocket сообщение отправлено");

        return true;

    } catch (error) {

        console.error("WebSocket: ошибка отправки сообщения:", error);

        return false;
    }
}

export function subscribeToMessages(onMessage) {

    currentMessageHandler = onMessage;

    if (!stompClient) {

        console.error("STOMP client не существует");

        return;
    }

    if (!stompClient.connected) {

        console.error("STOMP client ещё не подключен");

        return;
    }

    if (messageSubscription) {

        console.log("Подписка уже существует");

        return;
    }

    messageSubscription = stompClient.subscribe("/user/queue/messages", message => {

        console.log("========== WS MESSAGE RECEIVED ==========");

        console.log("Headers:", message.headers);

        console.log("Body:", message.body);

        try {

            const body = JSON.parse(message.body);

            console.log("Получено сообщение:", body);

            if (currentMessageHandler) {
                currentMessageHandler(body);
            }

        } catch (error) {

            console.error("Ошибка обработки WebSocket сообщения:", error);
        }
    });

    console.log("========== SUBSCRIBED ==========");

    console.log("Destination: /user/queue/messages");

    console.log("Subscription ID:", messageSubscription.id);

    console.log("Подписка /user/queue/messages создана");
}

export function sendMessage(recipientUsername, content) {

    return sendChatMessage(recipientUsername, content);
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