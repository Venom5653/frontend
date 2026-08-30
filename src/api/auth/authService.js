import {authApi} from "../api";

export const register = async (data) => {

    const response = await authApi.post("/auth/register", data);

    return response.data;
};

export const login = async (data) => {

    const response = await authApi.post("/auth/login", data);

    return response.data;
};

export const refresh = async () => {

    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
        throw new Error("Refresh token отсутствует");
    }

    const response = await authApi.post("/auth/refresh", null, {
        params: {
            refreshToken
        }
    });

    return response.data;
};
