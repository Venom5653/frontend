import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {connectWebSocket} from "../../services/messenger/websocketService.js";
import {login} from "../../api/auth/authService";

import "./Auth.css";


function LoginPage() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");

    const [password, setPassword] = useState("");

    const [error, setError] = useState("");

    const [loading, setLoading] = useState(false);


    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            const data = await login({
                username, password
            });

            if (!data.accessToken || !data.refreshToken) {
                throw new Error("Сервер не вернул токены");
            }

            localStorage.setItem("token", data.accessToken);

            localStorage.setItem("refreshToken", data.refreshToken);

            connectWebSocket(data.accessToken, () => {

                console.log("Авторизация и WebSocket готовы");

                navigate("/profile", {
                    replace: true
                });
            });

        } catch (error) {

            console.error("Ошибка авторизации:", error);

            setError("Неверное имя пользователя или пароль");

        } finally {

            setLoading(false);
        }
    };


    return (

        <div className="auth-container">

            <div className="auth-card">

                <h1>
                    Вход
                </h1>


                <form
                    onSubmit={handleSubmit}
                    className="auth-form"
                >

                    <label>
                        Username
                    </label>


                    <input
                        type="text"
                        value={username}
                        onChange={event => setUsername(event.target.value)}
                        required
                    />


                    <label>
                        Password
                    </label>


                    <input
                        type="password"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        required
                    />


                    {error && (

                        <p className="auth-error">
                            {error}
                        </p>

                    )}


                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Вход..." : "Войти"}
                    </button>

                </form>


                <button
                    className="secondary-button"
                    type="button"
                    onClick={() => navigate("/register")}
                >
                    Создать аккаунт
                </button>

            </div>

        </div>);
}


export default LoginPage;