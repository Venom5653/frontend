import {useEffect, useState} from "react";

import {
    Outlet,
    useNavigate
} from "react-router-dom";

import NavigationMenu from "../common/NavigationMenu.jsx";

import {
    getCurrentUser
} from "../../api/auth/userApi.js";

import {
    disconnectWebSocket
} from "../../services/messenger/websocketService.js";

import "./AuthorizedLayout.css";


function AuthorizedLayout() {

    const navigate = useNavigate();


    // =====================================================
    // STATE
    // =====================================================

    const [navigationOpen, setNavigationOpen] = useState(false);

    const [username, setUsername] = useState("");

    const [avatar, setAvatar] = useState(null);

    const [loading, setLoading] = useState(false);

    const [mobileChatOpen, setMobileChatOpen] = useState(false);


    // =====================================================
    // LOAD PROFILE
    // =====================================================

    useEffect(() => {

        const loadProfile = async () => {

            try {

                const response = await getCurrentUser();

                setUsername(response?.username || "");

                setAvatar(response?.avatar || null);

            } catch (error) {

                console.error(
                    "Не удалось загрузить данные пользователя:",
                    error
                );

            }
        };


        loadProfile();

    }, []);


    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = async () => {

        if (loading) {
            return;
        }


        try {

            setLoading(true);


            try {

                await disconnectWebSocket();

            } catch (webSocketError) {

                console.error(
                    "Ошибка отключения WebSocket:",
                    webSocketError
                );

            }


            localStorage.removeItem("token");

            localStorage.removeItem("refreshToken");

            localStorage.removeItem("username");


            navigate("/login", {
                replace: true
            });

        } catch (error) {

            console.error("Ошибка выхода:", error);

        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div
            className={
                `authorized-layout ${
                    mobileChatOpen
                        ? "mobile-chat-is-open"
                        : ""
                }`
            }
        >

            <button
                type="button"
                className="navigation-open-button"
                onClick={() => setNavigationOpen(true)}
                aria-label="Открыть навигацию"
            >
                ☰
            </button>


            <NavigationMenu
                open={navigationOpen}
                onClose={() => setNavigationOpen(false)}
                username={username}
                avatar={avatar}
                onLogout={handleLogout}
                logoutLoading={loading}
            />


            <main className="authorized-content">

                <Outlet
                    context={{
                        setMobileChatOpen
                    }}
                />

            </main>

        </div>

    );
}


export default AuthorizedLayout;