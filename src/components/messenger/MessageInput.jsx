function MessageInput({
                          content,
                          onChange,
                          onSend
                      }) {

    const handleKeyDown = event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            onSend();

        }

    };


    return (

        <div className="message-input-container">

            <textarea
                value={content}
                onChange={event =>
                    onChange(
                        event.target.value
                    )
                }
                onKeyDown={handleKeyDown}
                placeholder="Напишите сообщение..."
                rows="1"
            />


            <button
                type="button"
                onClick={onSend}
                disabled={!content.trim()}
                aria-label="Отправить сообщение"
            >
                ➤
            </button>

        </div>

    );

}


export default MessageInput;