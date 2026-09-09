import {
    useEffect, useState
} from "react";

import {
    isUserOnline
} from "../../services/messenger/presenceService.js";

import {
    getAvatarUrl, getAvatarLetter
} from "../../utils/chatUtils.js";


function ChatHeader({
                        username, avatar, onlineUsers, isGroup, onBack, onGroupSettings
                    }) {

    const [avatarError, setAvatarError] = useState(false);


    useEffect(() => {

        setAvatarError(false);

    }, [avatar]);


    const avatarUrl = getAvatarUrl(avatar);

    const avatarLetter = getAvatarLetter(username);


    return (

        <header className="chat-header">

            <button
                type="button"
                className="mobile-back-button"
                onClick={onBack}
                aria-label="Назад к чатам"
            >
                ←
            </button>


            <div className="chat-avatar-header">

                {avatarUrl && !avatarError ? (

                    <img
                        src={avatarUrl}
                        alt={username || "Avatar"}
                        onError={() => setAvatarError(true)}
                    />

                ) : (

                    <span>
                        {avatarLetter}
                    </span>

                )}

            </div>


            <div className="chat-header-info">

                <h2>
                    {username || "Пользователь"}
                </h2>

                <span>

                    {isGroup ? "Группа" : isUserOnline(onlineUsers, username) ? "В сети" : "Не в сети"}

                </span>

            </div>


            {isGroup && (

                <button
                    type="button"
                    className="group-settings-button"
                    onClick={onGroupSettings}
                    aria-label="Настройки группы"
                    title="Настройки группы"
                >
                    ⚙
                </button>

            )}

        </header>

    );

}


export default ChatHeader;