import {taskApi} from "../api";

export const getTasks = async (status = null, page = 0, size = 10) => {

    const params = {
        page, size
    };

    if (status) {
        params.status = status;
    }

    const response = await taskApi.get("/tasks", {
        params
    });

    return response.data;
};

export const createTask = async (data) => {

    const response = await taskApi.post("/tasks", data);

    return response.data;
};

export const updateTask = async (id, data) => {

    const response = await taskApi.put(`/tasks/${id}`, data);

    return response.data;
};

export const patchTask = async (id, data) => {

    const response = await taskApi.patch(`/tasks/${id}`, data);

    return response.data;
};

export const updateTaskStatus = async (id, status) => {

    const response = await taskApi.patch(`/tasks/${id}/status`, {
        status
    });

    return response.data;
};

export const deleteTask = async (id) => {

    await taskApi.delete(`/tasks/${id}`);
};