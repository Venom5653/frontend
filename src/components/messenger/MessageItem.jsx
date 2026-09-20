import {
    useEffect, useRef, useState
} from "react";

function MessageItem({
                         message, currentUsername, formatTime, onDeleteMessage, isGroup, currentUserRole
                     }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const own = message.senderUsername && currentUsername && message.senderUsername.trim().toLowerCase() === currentUsername.trim().toLowerCase();

    const canDelete = own || (isGroup && (currentUserRole === "OWNER" || currentUserRole === "ADMIN"));

    useEffect(() => {
        if (!menuOpen) {
            return;
        }

        const handleClickOutside = event => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuOpen]);

    const handleMessageClick = event => {
        if (!canDelete) {
            return;
        }

        if (event.target.closest(".message-context-menu")) {
            return;
        }

        setMenuOpen(previous => !previous);
    };

    const handleDelete = async event => {
        event.stopPropagation();

        if (!message?.id || !onDeleteMessage) {
            return;
        }

        setMenuOpen(false);

        await onDeleteMessage(message.id);
    };

    return (<div className={`message-row ${own ? "own" : "other"}`}>
            <div
                className={`message-bubble ${canDelete && menuOpen ? "context-menu-open" : ""}`}
                onClick={handleMessageClick}
                ref={canDelete ? menuRef : null}
            >
                {!own && (<div className="message-sender">
                        {message.senderUsername || "Пользователь"}
                    </div>)}

                <div className="message-content">
                    {message.content}
                </div>

                <div className="message-time">
                    {formatTime(message.createdAt)}

                    {own && (<span
                            className={`message-read-status ${message.read ? "read" : ""}`}
                        >
                            {message.read ? "✓✓" : "✓"}
                        </span>)}
                </div>

                {canDelete && menuOpen && (
                    <div
                        className={`message-context-menu ${
                            own ? "menu-own" : "menu-other"
                        }`}
                        onClick={event => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={handleDelete}
                        >
                            Удалить
                        </button>
                    </div>
                )}
            </div>
        </div>);
}

export default MessageItem;