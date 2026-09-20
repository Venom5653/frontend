import MessageItem from "./MessageItem.jsx";

function MessagesContainer({
                               messages,
                               currentUsername,
                               loadingMessages,
                               loadingOlderMessages,
                               containerRef,
                               onScroll,
                               onDeleteMessage,
                               isGroup,
                               currentUserRole
                           }) {
    const formatTime = date => {
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

    return (<div
            className="messages-container"
            ref={containerRef}
            onScroll={onScroll}
        >
            {loadingOlderMessages && (<div className="older-messages-loading">
                    Загрузка старых сообщений...
                </div>)}

            {loadingMessages ? (<div className="messages-loading">
                    Загрузка сообщений...
                </div>) : messages.length === 0 ? (<div className="no-messages">
                    <div>
                        👋
                    </div>

                    <p>
                        Сообщений пока нет
                    </p>

                    <span>
                        Напишите первое сообщение
                    </span>
                </div>) : (messages.map(message => (<MessageItem
                        key={message.id}
                        message={message}
                        currentUsername={currentUsername}
                        formatTime={formatTime}
                        onDeleteMessage={onDeleteMessage}
                        isGroup={isGroup}
                        currentUserRole={currentUserRole}
                    />)))}
        </div>);
}

export default MessagesContainer;