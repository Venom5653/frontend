import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";

import {
    getTasks, deleteTask, updateTaskStatus
} from "../../api/task/taskService";

import "./Task.css";


function TasksPage() {

    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [status, setStatus] = useState("");


    const loadTasks = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getTasks(status || null);

            setTasks(data.content || []);

        } catch (error) {

            console.error("Ошибка загрузки задач:", error);

            setError("Не удалось загрузить задачи");

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        loadTasks();

    }, [status]);


    const handleDelete = async (id) => {

        if (!window.confirm("Удалить задачу?")) {
            return;
        }

        try {

            await deleteTask(id);

            setTasks(previous => previous.filter(task => task.id !== id));

        } catch (error) {

            console.error("Ошибка удаления:", error);

            setError("Не удалось удалить задачу");
        }
    };


    const handleStatusChange = async (id, newStatus) => {

        try {

            const updatedTask = await updateTaskStatus(id, newStatus);

            setTasks(previous => previous.map(task => task.id === id ? updatedTask : task));

        } catch (error) {

            console.error("Ошибка изменения статуса:", error);

            setError("Не удалось изменить статус");
        }
    };

    if (loading) {

        return (

            <div className="tasks-page">

                <h2>
                    Загрузка задач...
                </h2>

            </div>);
    }


    return (

        <div className="tasks-page">

            <header className="tasks-header">

                <h1>
                    Мои задачи
                </h1>


                <div className="tasks-actions">

                    <button
                        onClick={() => navigate("/tasks/create")}
                    >
                        + Создать задачу
                    </button>

                </div>

            </header>


            <div className="task-filter">

                <label>
                    Фильтр:
                </label>


                <select
                    value={status}
                    onChange={event => setStatus(event.target.value)}
                >

                    <option value="">
                        Все
                    </option>

                    <option value="TODO">
                        TODO
                    </option>

                    <option value="IN_PROGRESS">
                        IN_PROGRESS
                    </option>

                    <option value="DONE">
                        DONE
                    </option>

                </select>

            </div>


            {error && (

                <p className="task-error">
                    {error}
                </p>

            )}


            {tasks.length === 0 ? (

                <div className="empty-tasks">

                    Задач пока нет

                </div>

            ) : (

                <div className="tasks-list">

                    {tasks.map(task => (

                        <div
                            className="task-card"
                            key={task.id}
                        >

                            <div className="task-content">

                                <h2>
                                    {task.title}
                                </h2>


                                <p>
                                    {task.description || "Без описания"}
                                </p>


                                <small>

                                    Создана:{" "}

                                    {new Date(task.createdAt).toLocaleString()}

                                </small>

                            </div>


                            <div className="task-controls">

                                <select
                                    value={task.status}
                                    onChange={event => handleStatusChange(task.id, event.target.value)}
                                >

                                    <option value="TODO">
                                        TODO
                                    </option>

                                    <option value="IN_PROGRESS">
                                        IN_PROGRESS
                                    </option>

                                    <option value="DONE">
                                        DONE
                                    </option>

                                </select>


                                <button
                                    className="delete-button"
                                    onClick={() => handleDelete(task.id)}
                                >
                                    Удалить
                                </button>

                            </div>

                        </div>

                    ))}

                </div>)}

        </div>);
}


export default TasksPage;