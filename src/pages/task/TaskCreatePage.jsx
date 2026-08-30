import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {createTask} from "../../api/task/taskService";
import "./Task.css";

function TaskCreatePage() {

    const navigate = useNavigate();

    const [title, setTitle] = useState("");

    const [description, setDescription] = useState("");

    const [error, setError] = useState("");

    const [loading, setLoading] = useState(false);


    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            await createTask({
                title, description
            });

            navigate("/tasks");

        } catch (error) {

            console.error("Ошибка создания задачи:", error);

            setError("Не удалось создать задачу");

        } finally {

            setLoading(false);
        }
    };


    return (<div className="task-form-page">

            <div className="task-form-card">

                <h1>
                    Создание задачи
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="task-form"
                >

                    <label>
                        Название
                    </label>

                    <input
                        type="text"
                        value={title}
                        onChange={event => setTitle(event.target.value)}
                        minLength={3}
                        maxLength={100}
                        required
                    />


                    <label>
                        Описание
                    </label>

                    <textarea
                        value={description}
                        onChange={event => setDescription(event.target.value)}
                        maxLength={500}
                        rows={6}
                    />


                    {error && (<p className="task-error">
                            {error}
                        </p>)}


                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Создание..." : "Создать"}
                    </button>

                </form>


                <button
                    className="back-button"
                    onClick={() => navigate("/tasks")}
                >
                    ← Назад
                </button>

            </div>

        </div>);
}

export default TaskCreatePage;