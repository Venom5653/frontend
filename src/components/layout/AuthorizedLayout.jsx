import {useEffect, useState} from "react";
import {Outlet, useNavigate} from "react-router-dom";

import NavigationMenu from "../common/NavigationMenu.jsx";

import {
    getCurrentUser
} from "../../api/auth/userApi.js";

import {
    disconnectWebSocket
} from "../../services/messenger/websocketService.js";

import {authApi} from "../../api/api.js";

import "./AuthorizedLayout.css";


function AuthorizedLayout() {

    const navigate = useNavigate();

    const [navigationOpen, setNavigationOpen] = useState(false);

    const [username, setUsername] = useState("");

    const [avatar, setAvatar] = useState(null);

    const [avatarUrl, setAvatarUrl] = useState(null);

    const [loading, setLoading] = useState(false);


    // =====================================================
    // ЗАГРУЗКА USERNAME И АВАТАРА
    // =====================================================

    useEffect(() => {

        let objectUrl = null;

        const loadProfile = async () => {

            try {

                const response = await getCurrentUser();

                setUsername(response.username || "");


                const avatarPath = response.avatar || null;

                setAvatar(avatarPath);


                if (!avatarPath) {

                    setAvatarUrl(null);

                    return;
                }


                const avatarRequestPath = avatarPath.startsWith("/api/") ? avatarPath.substring(4) : avatarPath;


                const imageResponse = await authApi.get(avatarRequestPath, {
                    responseType: "blob"
                });


                objectUrl = URL.createObjectURL(imageResponse.data);


                setAvatarUrl(objectUrl);

            } catch (error) {

                console.error("Не удалось загрузить данные пользователя:", error);

            }
        };


        loadProfile();


        return () => {

            if (objectUrl) {

                URL.revokeObjectURL(objectUrl);
            }
        };

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


            // =============================================
            // Отключаем WebSocket
            // =============================================

            try {

                await disconnectWebSocket();

            } catch (webSocketError) {

                console.error("Ошибка отключения WebSocket:", webSocketError);
            }


            // =============================================
            // Очищаем авторизацию
            // =============================================

            localStorage.removeItem("token");

            localStorage.removeItem("refreshToken");

            localStorage.removeItem("username");


            // =============================================
            // Переход на LOGIN
            // =============================================

            navigate("/login", {
                replace: true
            });

        } catch (error) {

            console.error("Ошибка выхода:", error);

        } finally {

            setLoading(false);
        }
    };


    return (

        <div className="authorized-layout">

            {/* =================================================
                КНОПКА НАВИГАЦИИ
            ================================================= */}

            <button
                type="button"
                className="navigation-open-button"
                onClick={() => setNavigationOpen(true)}
                aria-label="Открыть навигацию"
            >
                ☰
            </button>


            {/* =================================================
                NAVIGATION MENU
            ================================================= */}

            <NavigationMenu
                open={navigationOpen}
                onClose={() => setNavigationOpen(false)}
                username={username}
                avatar={avatar}
                onLogout={handleLogout}
                logoutLoading={loading}
            />


            {/* =================================================
                PAGE
            ================================================= */}

            <main className="authorized-content">

                <Outlet/>

            </main>

        </div>);
}


export default AuthorizedLayout;