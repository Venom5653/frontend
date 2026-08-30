import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
    updateUsername, updatePassword, deleteCurrentUser, updateAvatar, getCurrentUser, deleteAvatar
} from "../../api/auth/userApi.js";

import {authApi} from "../../api/api.js";

import {
    disconnectWebSocket
} from "../../services/messenger/websocketService.js";

import "./Profile.css";


function ProfilePage() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");

    const [oldPassword, setOldPassword] = useState("");

    const [newPassword, setNewPassword] = useState("");


    const [avatar, setAvatar] = useState(null);

    const [avatarUrl, setAvatarUrl] = useState(null);

    const [avatarFile, setAvatarFile] = useState(null);

    const [avatarPreview, setAvatarPreview] = useState(null);


    const [message, setMessage] = useState("");

    const [error, setError] = useState("");

    const [loading, setLoading] = useState(false);

    const getCurrentUsername = () => {

        const token = localStorage.getItem("token");

        if (!token) {
            return "";
        }


        try {

            const payload = JSON.parse(atob(token
                .split(".")[1]
                .replace(/-/g, "+")
                .replace(/_/g, "/")));


            return payload.sub || "";

        } catch (error) {

            console.error("Не удалось прочитать JWT:", error);

            return "";
        }
    };


    const currentUsername = getCurrentUsername();


    const avatarLetter = currentUsername ? currentUsername.charAt(0).toUpperCase() : "?";


    // =====================================================
    // ЗАГРУЗКА ПРОФИЛЯ
    // =====================================================

    useEffect(() => {

        let objectUrl = null;


        const loadProfile = async () => {

            try {

                const response = await getCurrentUser();

                const avatarPath = response.avatar || null;


                setAvatar(avatarPath);


                if (!avatarPath) {
                    return;
                }


                const avatarRequestPath = avatarPath.startsWith("/api/") ? avatarPath.substring(4) : avatarPath;


                const imageResponse = await authApi.get(avatarRequestPath, {
                    responseType: "blob"
                });


                objectUrl = URL.createObjectURL(imageResponse.data);


                setAvatarUrl(objectUrl);

            } catch (error) {

                console.error("Не удалось загрузить профиль/аватар:", error);
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
    // УДАЛЕНИЕ АВАТАРА
    // =====================================================

    const handleDeleteAvatar = async () => {

        const confirmed = window.confirm("Удалить текущий аватар?");


        if (!confirmed) {
            return;
        }


        try {

            setLoading(true);

            setError("");

            setMessage("");


            await deleteAvatar();


            setAvatar(null);


            if (avatarUrl) {

                URL.revokeObjectURL(avatarUrl);
            }


            setAvatarUrl(null);


            if (avatarPreview) {

                URL.revokeObjectURL(avatarPreview);
            }


            setAvatarPreview(null);

            setAvatarFile(null);


            const input = document.getElementById("avatar-input");


            if (input) {
                input.value = "";
            }


            setMessage("Аватар успешно удалён");

        } catch (error) {

            console.error("Ошибка удаления аватара:", error);


            setError(error.response?.data?.message || "Не удалось удалить аватар");

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // ВЫБОР АВАТАРА
    // =====================================================

    const handleAvatarChange = (event) => {

        const file = event.target.files?.[0];


        if (!file) {
            return;
        }


        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];


        if (!allowedTypes.includes(file.type)) {

            setError("Можно выбрать только JPG, PNG или WEBP");


            event.target.value = "";

            return;
        }


        if (file.size > 5 * 1024 * 1024) {

            setError("Размер изображения не должен превышать 5 MB");


            event.target.value = "";

            return;
        }


        setError("");

        setMessage("");


        if (avatarPreview) {

            URL.revokeObjectURL(avatarPreview);
        }


        const previewUrl = URL.createObjectURL(file);


        setAvatarFile(file);

        setAvatarPreview(previewUrl);
    };


    // =====================================================
    // СОХРАНЕНИЕ АВАТАРА
    // =====================================================

    const handleUpdateAvatar = async () => {

        if (!avatarFile) {

            setError("Сначала выберите изображение");

            return;
        }


        try {

            setLoading(true);

            setError("");

            setMessage("");


            const response = await updateAvatar(avatarFile);


            const newAvatar = response.avatar || null;


            setAvatar(newAvatar);


            // =============================================
            // Удаляем старый Blob URL
            // =============================================

            if (avatarUrl) {

                URL.revokeObjectURL(avatarUrl);
            }


            // =============================================
            // Получаем новый аватар через authApi
            // =============================================

            if (newAvatar) {

                const avatarRequestPath = newAvatar.startsWith("/api/") ? newAvatar.substring(4) : newAvatar;


                const imageResponse = await authApi.get(avatarRequestPath, {
                    responseType: "blob"
                });


                const newObjectUrl = URL.createObjectURL(imageResponse.data);


                setAvatarUrl(newObjectUrl);
            } else {

                setAvatarUrl(null);
            }


            // =============================================
            // Удаляем preview
            // =============================================

            setAvatarFile(null);


            if (avatarPreview) {

                URL.revokeObjectURL(avatarPreview);
            }


            setAvatarPreview(null);


            const input = document.getElementById("avatar-input");


            if (input) {
                input.value = "";
            }


            setMessage("Аватар успешно изменён");

        } catch (error) {

            console.error("Ошибка загрузки аватара:", error);


            setError(error.response?.data?.message || "Не удалось изменить аватар");

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // ОТМЕНА ВЫБОРА АВАТАРА
    // =====================================================

    const handleCancelAvatar = () => {

        setAvatarFile(null);


        if (avatarPreview) {

            URL.revokeObjectURL(avatarPreview);
        }


        setAvatarPreview(null);


        setError("");


        setMessage("");


        const input = document.getElementById("avatar-input");


        if (input) {
            input.value = "";
        }
    };


    // =====================================================
    // ИЗМЕНЕНИЕ USERNAME
    // =====================================================

    const handleUpdateUsername = async (event) => {

        event.preventDefault();


        if (!username.trim()) {

            setError("Введите новое имя");

            return;
        }


        if (username.trim() === currentUsername) {

            setError("Новое имя должно отличаться от текущего");

            return;
        }


        try {

            setLoading(true);

            setError("");

            setMessage("");


            const response = await updateUsername(username.trim());


            if (response.accessToken) {

                localStorage.setItem("token", response.accessToken);
            }


            if (response.refreshToken) {

                localStorage.setItem("refreshToken", response.refreshToken);
            }


            setUsername("");


            setMessage("Имя пользователя успешно изменено");


            setTimeout(() => {

                window.location.reload();

            }, 500);

        } catch (error) {

            console.error("Ошибка изменения username:", error);


            setError(error.response?.data?.message || "Не удалось изменить имя пользователя");

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // ИЗМЕНЕНИЕ ПАРОЛЯ
    // =====================================================

    const handleUpdatePassword = async (event) => {

        event.preventDefault();


        if (!oldPassword || !newPassword) {

            setError("Заполните оба поля пароля");

            return;
        }


        if (newPassword.length < 6) {

            setError("Новый пароль должен содержать минимум 6 символов");

            return;
        }


        try {

            setLoading(true);

            setError("");

            setMessage("");


            const response = await updatePassword(oldPassword, newPassword);


            if (response.accessToken) {

                localStorage.setItem("token", response.accessToken);
            }


            if (response.refreshToken) {

                localStorage.setItem("refreshToken", response.refreshToken);
            }


            setOldPassword("");

            setNewPassword("");


            setMessage("Пароль успешно изменён");

        } catch (error) {

            console.error("Ошибка изменения пароля:", error);


            setError(error.response?.data?.message || "Не удалось изменить пароль");

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // УДАЛЕНИЕ АККАУНТА
    // =====================================================

    const handleDeleteAccount = async () => {

        const confirmed = window.confirm("Вы уверены?\n\nАккаунт и все ваши задачи будут удалены.");


        if (!confirmed) {
            return;
        }


        try {

            setLoading(true);

            setError("");

            setMessage("");


            await deleteCurrentUser();


            // =============================================
            // Отключаем WebSocket
            // =============================================

            try {

                await disconnectWebSocket();

            } catch (webSocketError) {

                console.error("Ошибка отключения WebSocket:", webSocketError);
            }


            localStorage.removeItem("token");

            localStorage.removeItem("refreshToken");

            localStorage.removeItem("username");


            navigate("/login", {
                replace: true
            });

        } catch (error) {

            console.error("Ошибка удаления аккаунта:", error);


            setError(error.response?.data?.message || "Не удалось удалить аккаунт");

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = async () => {

        try {

            setLoading(true);

            setError("");


            // =============================================
            // Отключаем WebSocket
            // =============================================

            await disconnectWebSocket();

        } catch (error) {

            console.error("Ошибка отключения WebSocket:", error);

        } finally {

            // =============================================
            // Удаляем авторизационные данные
            // =============================================

            localStorage.removeItem("token");

            localStorage.removeItem("refreshToken");

            localStorage.removeItem("username");


            navigate("/login", {
                replace: true
            });


            setLoading(false);
        }
    };

    const displayedAvatar = avatarPreview || avatarUrl;

    return (

        <div className="profile-page">

            <div className="profile-card">

                <div className="profile-avatar">

                    {displayedAvatar ? (

                        <img
                            src={displayedAvatar}
                            alt="Аватар пользователя"
                        />

                    ) : (

                        <span>
                            {avatarLetter}
                        </span>

                    )}

                </div>


                <h1>
                    {currentUsername || "Пользователь"}
                </h1>


                <p className="profile-subtitle">
                    Ваш профиль
                </p>


                {/* =================================================
                    AVATAR
                ================================================= */}

                <div className="avatar-upload">

                    <label
                        className="profile-button"
                        htmlFor="avatar-input"
                    >
                        Изменить аватар
                    </label>


                    <input
                        id="avatar-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarChange}
                        disabled={loading}
                        style={{
                            display: "none"
                        }}
                    />


                    {/* =============================================
                        КНОПКА УДАЛЕНИЯ
                    ============================================== */}

                    {avatar && !avatarFile && (

                        <button
                            type="button"
                            className="delete-avatar-button"
                            onClick={handleDeleteAvatar}
                            disabled={loading}
                        >
                            Удалить аватар
                        </button>

                    )}


                    {/* =============================================
                        ДЕЙСТВИЯ ПОСЛЕ ВЫБОРА
                    ============================================== */}

                    {avatarFile && (

                        <div className="avatar-actions">

                            <button
                                type="button"
                                className="profile-button"
                                onClick={handleUpdateAvatar}
                                disabled={loading}
                            >
                                {loading ? "Загрузка..." : "Сохранить аватар"}
                            </button>


                            <button
                                type="button"
                                className="cancel-button"
                                onClick={handleCancelAvatar}
                                disabled={loading}
                            >
                                Отмена
                            </button>

                        </div>

                    )}

                </div>

            </div>


            {/* =================================================
                MESSAGES
            ================================================= */}

            {message && (

                <div className="success">
                    {message}
                </div>

            )}


            {error && (

                <div className="error-message">
                    {error}
                </div>

            )}


            {/* =================================================
                USERNAME
            ================================================= */}

            <div className="profile-section">

                <h2>
                    Изменить имя
                </h2>


                <p className="section-description">
                    Измените имя, которое используется
                    для входа в аккаунт.
                </p>


                <form
                    onSubmit={handleUpdateUsername}
                >

                    <div className="form-group">

                        <label>
                            Новое имя пользователя
                        </label>


                        <input
                            type="text"
                            value={username}
                            onChange={event => setUsername(event.target.value)}
                            placeholder={currentUsername || "Введите новое имя"}
                            disabled={loading}
                        />

                    </div>


                    <button
                        className="profile-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Сохранение..." : "Изменить имя"}
                    </button>

                </form>

            </div>


            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="profile-section">

                <h2>
                    Изменить пароль
                </h2>


                <p className="section-description">
                    Для изменения пароля сначала
                    введите текущий пароль.
                </p>


                <form
                    onSubmit={handleUpdatePassword}
                >

                    <div className="form-group">

                        <label>
                            Текущий пароль
                        </label>


                        <input
                            type="password"
                            value={oldPassword}
                            onChange={event => setOldPassword(event.target.value)}
                            placeholder="Текущий пароль"
                            disabled={loading}
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Новый пароль
                        </label>


                        <input
                            type="password"
                            value={newPassword}
                            onChange={event => setNewPassword(event.target.value)}
                            placeholder="Минимум 6 символов"
                            disabled={loading}
                        />

                    </div>


                    <button
                        className="profile-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Сохранение..." : "Изменить пароль"}
                    </button>

                </form>

            </div>


            {/* =================================================
                LOGOUT
            ================================================= */}

            <div className="profile-section">

                <h2>
                    Выход
                </h2>


                <p className="section-description">
                    Выход из аккаунта завершит текущую сессию
                    на этом устройстве.
                </p>


                <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                    disabled={loading}
                >
                    {loading ? "Выход..." : "Выйти из аккаунта"}
                </button>

            </div>


            {/* =================================================
                DELETE ACCOUNT
            ================================================= */}

            <div className="profile-section danger-section">

                <h2>
                    Удаление аккаунта
                </h2>


                <p className="section-description">
                    Это действие необратимо.
                    Вместе с аккаунтом будут удалены
                    все ваши задачи.
                </p>


                <button
                    className="delete-button"
                    onClick={handleDeleteAccount}
                    disabled={loading}
                >
                    Удалить аккаунт
                </button>

            </div>

        </div>);
}


export default ProfilePage;