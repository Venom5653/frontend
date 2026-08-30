import React, {useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";

import "./NavigationMenu.css";

const API_URL = import.meta.env.VITE_API_URL;

const NavigationMenu = ({
                            open, onClose, username, avatar, onLogout, logoutLoading = false
                        }) => {

    const navigate = useNavigate();
    const location = useLocation();


    // =====================================================
    // ESC
    // =====================================================

    useEffect(() => {

        const handleKeyDown = (event) => {

            if (event.key === "Escape" && open) {
                onClose();
            }
        };


        document.addEventListener("keydown", handleKeyDown);


        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };

    }, [open, onClose]);


    // =====================================================
    // NAVIGATION
    // =====================================================

    const navigateTo = (path) => {

        onClose();

        navigate(path);
    };


    // =====================================================
    // AVATAR URL
    // =====================================================

    const getAvatarUrl = (value) => {

        if (!value || typeof value !== "string") {
            return null;
        }


        const cleanValue = value.trim();


        if (!cleanValue) {
            return null;
        }


        if (cleanValue.startsWith("http://") || cleanValue.startsWith("https://")) {
            return cleanValue;
        }


        if (cleanValue.startsWith("/")) {
            return `${API_URL}${cleanValue}`;
        }

        return `${API_URL}/${cleanValue}`;
    };


    const avatarUrl = getAvatarUrl(avatar);


    const avatarLetter = username?.trim()?.charAt(0)?.toUpperCase() || "?";


    // =====================================================
    // PROFILE
    // =====================================================

    const openProfile = () => {

        onClose();

        navigate("/profile");
    };


    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = async () => {

        if (logoutLoading) {
            return;
        }


        if (onLogout) {
            await onLogout();
        }
    };


    return (

        <>

            {/* =================================================
                OVERLAY
            ================================================= */}

            <div
                className={`navigation-overlay ${open ? "open" : ""}`}
                onClick={onClose}
            />


            {/* =================================================
                MENU
            ================================================= */}

            <aside
                className={`navigation-menu ${open ? "open" : ""}`}
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="navigation-header">

                    <div className="navigation-title">

                        <span className="navigation-title-icon">
                            ☰
                        </span>

                        <span>
                            Навигация
                        </span>

                    </div>


                    <button
                        type="button"
                        className="navigation-close"
                        onClick={onClose}
                        aria-label="Закрыть меню"
                    >
                        ×
                    </button>

                </div>


                {/* =================================================
                    MENU ITEMS
                ================================================= */}

                <nav className="navigation-list">

                    <button
                        type="button"
                        className={`navigation-item ${location.pathname === "/messenger" ? "active" : ""}`}
                        onClick={() => navigateTo("/messenger")}
                    >

                        <span className="navigation-item-icon">
                            💬
                        </span>


                        <span className="navigation-item-content">

                            <span className="navigation-item-title">
                                Мессенджер
                            </span>

                            <span className="navigation-item-description">
                                Общение и сообщения
                            </span>

                        </span>

                    </button>


                    <button
                        type="button"
                        className={`navigation-item ${location.pathname === "/tasks" ? "active" : ""}`}
                        onClick={() => navigateTo("/tasks")}
                    >

                        <span className="navigation-item-icon">
                            ✓
                        </span>


                        <span className="navigation-item-content">

                            <span className="navigation-item-title">
                                Задачи
                            </span>

                            <span className="navigation-item-description">
                                Управление задачами
                            </span>

                        </span>

                    </button>

                </nav>


                {/* =================================================
                    PROFILE
                ================================================= */}

                <div className="navigation-profile">

                    <button
                        type="button"
                        className="navigation-profile-main"
                        onClick={openProfile}
                    >

                        <div className="navigation-profile-avatar">

                            {avatarUrl ? (

                                <img
                                    src={avatarUrl}
                                    alt={username || "Профиль"}
                                    onError={(event) => {

                                        event.currentTarget.style.display = "none";

                                        const parent = event.currentTarget.parentElement;

                                        parent?.classList.add("navigation-profile-avatar-error");
                                    }}
                                />

                            ) : (

                                <span>
                                    {avatarLetter}
                                </span>

                            )}

                        </div>


                        <div className="navigation-profile-info">

                            <span className="navigation-profile-username">
                                {username || "Пользователь"}
                            </span>


                            {/* =================================================
                                СТАТУС — ПОКА ЗАГЛУШКА
                                ================================================= */}

                            <span className="navigation-profile-status">
                                <span className="navigation-status-dot"/>
                                В сети
                            </span>

                        </div>

                    </button>


                    {/* =================================================
                        LOGOUT
                    ================================================= */}

                    <button
                        type="button"
                        className="navigation-logout"
                        onClick={handleLogout}
                        disabled={logoutLoading}
                        title="Выйти из аккаунта"
                    >

                        <span className="navigation-logout-icon">
                            ↪
                        </span>

                        <span>
                            {logoutLoading ? "Выход..." : "Выйти"}
                        </span>

                    </button>

                </div>

            </aside>

        </>

    );
};


export default NavigationMenu;