function MessageItem({
                         message, currentUsername, formatTime
                     }) {

    const own = message.senderUsername && currentUsername && message.senderUsername
        .toLowerCase() === currentUsername
        .toLowerCase();


    return (

        <div
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

}


export default MessageItem;