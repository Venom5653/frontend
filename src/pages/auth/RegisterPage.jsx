import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {register} from "../../api/auth/authService";
import "./Auth.css";

function RegisterPage() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");

    const [password, setPassword] = useState("");

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [loading, setLoading] = useState(false);


    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {

            await register({
                username, password
            });

            setSuccess("Аккаунт успешно создан");

            setTimeout(() => {

                navigate("/login");

            }, 1000);

        } catch (error) {

            console.error("Ошибка регистрации:", error);

            if (error.response?.status === 409) {

                setError("Такой username уже существует");

            } else {

                setError("Не удалось создать аккаунт");
            }

        } finally {

            setLoading(false);
        }
    };


    return (<div className="auth-container">

            <div className="auth-card">

                <h1>Регистрация</h1>

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


                    {error && (<p className="auth-error">
                            {error}
                        </p>)}


                    {success && (<p className="auth-success">
                            {success}
                        </p>)}


                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Создание..." : "Зарегистрироваться"}
                    </button>

                </form>


                <button
                    className="secondary-button"
                    type="button"
                    onClick={() => navigate("/login")}
                >
                    Уже есть аккаунт
                </button>

            </div>

        </div>);
}

export default RegisterPage;