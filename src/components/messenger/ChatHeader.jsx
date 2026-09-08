import {
    useEffect,
    useState
} from "react";

import {
    isUserOnline
} from "../../services/messenger/presenceService.js";


const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080";


function ChatHeader({
                        username,
                        avatar,
                        onlineUsers,
                        onBack
                    }) {

    const [
        avatarError,
        setAvatarError
    ] =
        useState(false);


    useEffect(() => {

        setAvatarError(false);

    }, [avatar]);


    const getAvatarUrl = () => {

        if (
            !avatar ||
            typeof avatar !== "string"
        ) {

            return null;

        }


        const value =
            avatar.trim();


        if (!value) {
            return null;
        }


        if (
            value.startsWith("http://") ||
            value.startsWith("https://")
        ) {

            return value;

        }


        if (
            value.startsWith("/")
        ) {

            return `${API_URL}${value}`;

        }


        return `${API_URL}/${value}`;

    };


    const getAvatarLetter = () => {

        if (!username) {
            return "?";
        }


        return username
            .trim()
            .charAt(0)
            .toUpperCase();

    };


    const avatarUrl =
        getAvatarUrl();


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

                {avatarUrl &&
                !avatarError ? (

                    <img
                        src={avatarUrl}
                        alt={username || "Avatar"}
                        onError={() =>
                            setAvatarError(true)
                        }
                    />

                ) : (

                    <span>

                        {getAvatarLetter()}

                    </span>

                )}

            </div>


            <div className="chat-header-info">

                <h2>

                    {username ||
                        "Пользователь"}

                </h2>


                <span>

                    {isUserOnline(
                        onlineUsers,
                        username
                    )

                        ? "В сети"

                        : "Не в сети"

                    }

                </span>

            </div>

        </header>

    );

}


export default ChatHeader;