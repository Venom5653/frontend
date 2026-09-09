import {
    useCallback,
    useLayoutEffect,
    useRef,
    useState
} from "react";

import messengerApi from "../../api/messenger/messengerApi.js";


const PAGE_SIZE = 50;


function useChatMessages() {


// =====================================================
// STATE
// =====================================================

    const [messages, setMessages] = useState([]);

    const [loadingMessages, setLoadingMessages] = useState(false);

    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

    const [hasMoreMessages, setHasMoreMessages] = useState(true);

    const [error, setError] = useState("");


// =====================================================
// REFS
// =====================================================

    const messagesContainerRef = useRef(null);

    const selectedChatRef = useRef(null);

    const shouldScrollToBottomRef = useRef(true);

    const isOpeningChatRef = useRef(false);

    const previousScrollRef = useRef(null);

    const loadingOlderMessagesRef = useRef(false);


// =====================================================
// CHECK SCROLL POSITION
// =====================================================

    const checkIfNearBottom = () => {

        const container = messagesContainerRef.current;


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
// LOAD CHAT MESSAGES
// =====================================================

    const loadChatMessages = useCallback(async chat => {

        if (!chat?.id) {
            return;
        }


        selectedChatRef.current = chat;


        setLoadingMessages(true);

        setError("");

        setHasMoreMessages(true);

        previousScrollRef.current = null;

        isOpeningChatRef.current = true;

        shouldScrollToBottomRef.current = true;

        setMessages([]);


        try {

            const response = await messengerApi.get(
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
                loadedMessages.length === PAGE_SIZE
            );


            return loadedMessages;

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


            return [];

        } finally {

            setLoadingMessages(false);

        }

    }, []);


// =====================================================
// LOAD OLDER MESSAGES
// =====================================================

    const loadOlderMessages = async () => {

        const selectedChat =
            selectedChatRef.current;


        if (
            loadingOlderMessagesRef.current ||
            !selectedChat ||
            !messages.length ||
            !hasMoreMessages
        ) {
            return;
        }


        const oldestMessage = messages[0];


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
                olderMessages.length < PAGE_SIZE
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

            loadingOlderMessagesRef.current = false;

            setLoadingOlderMessages(false);

        }

    };


// =====================================================
// HANDLE SCROLL
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
// RESTORE SCROLL
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


        if (
            !loadingMessages &&
            shouldScrollToBottomRef.current
        ) {

            requestAnimationFrame(() => {

                container.scrollTop =
                    container.scrollHeight;

            });

        }

    }, [messages, loadingMessages]);


// =====================================================
// ADD MESSAGE
// =====================================================

    const addMessage = message => {

        shouldScrollToBottomRef.current = true;


        setMessages(previous => {

            const exists =
                previous.some(
                    item =>
                        Number(item.id) ===
                        Number(message.id)
                );


            if (exists) {
                return previous;
            }


            return [

                ...previous,

                message

            ];

        });

    };


// =====================================================
// MARK MESSAGE AS READ
// =====================================================
//
// messageId здесь является lastReadMessageId.
//
// Это означает:
//
// все сообщения с id <= messageId
// считаются прочитанными.
//

    const markMessageAsRead = messageId => {

        if (!messageId) {
            return;
        }


        const lastReadMessageId =
            Number(messageId);


        setMessages(previous =>

            previous.map(message => {

                const currentMessageId =
                    Number(message.id);


                if (
                    currentMessageId <=
                    lastReadMessageId
                ) {

                    return {

                        ...message,

                        read: true

                    };

                }


                return message;

            })

        );

    };


// =====================================================
// CLOSE MESSAGES
// =====================================================

    const closeMessages = () => {

        selectedChatRef.current = null;

        setMessages([]);

        setHasMoreMessages(true);

        setError("");

    };


// =====================================================
// RETURN
// =====================================================

    return {

        messages,

        loadingMessages,

        loadingOlderMessages,

        hasMoreMessages,

        error,

        setError,

        messagesContainerRef,

        shouldScrollToBottomRef,

        selectedChatRef,

        loadChatMessages,

        handleMessagesScroll,

        addMessage,

        markMessageAsRead,

        closeMessages

    };

}


export default useChatMessages;