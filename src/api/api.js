import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export const authApi = axios.create({
    baseURL: API_URL
});

export const taskApi = axios.create({
    baseURL: API_URL
});

let refreshPromise = null;

export const refreshAccessToken = async () => {

    if (refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
        throw new Error("Refresh token отсутствует");
    }

    refreshPromise = axios.post(`${API_URL}/auth/refresh`, null, {
        params: {
            refreshToken
        }
    })
        .then(response => {

            const newAccessToken = response.data.accessToken;
            const newRefreshToken = response.data.refreshToken;

            if (!newAccessToken) {
                throw new Error("Сервер не вернул access token");
            }

            localStorage.setItem("token", newAccessToken);

            if (newRefreshToken) {
                localStorage.setItem("refreshToken", newRefreshToken);
            }

            return newAccessToken;
        })
        .catch(error => {

            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("username");

            window.location.href = "/login";

            throw error;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
};


const addTokenInterceptor = api => {

    api.interceptors.request.use(config => {

            const token = localStorage.getItem("token");

            if (token) {

                config.headers = config.headers || {};

                config.headers.Authorization = `Bearer ${token}`;
            }

            return config;
        },

        error => Promise.reject(error));
};


addTokenInterceptor(authApi);
addTokenInterceptor(taskApi);


const addRefreshInterceptor = api => {

    api.interceptors.response.use(response => response,

        async error => {

            const originalRequest = error.config;

            if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
                return Promise.reject(error);
            }

            if (originalRequest.url?.includes("/auth/refresh")) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {

                const newAccessToken = await refreshAccessToken();

                originalRequest.headers = originalRequest.headers || {};

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return api(originalRequest);

            } catch (refreshError) {

                return Promise.reject(refreshError);
            }
        });
};


addRefreshInterceptor(authApi);
addRefreshInterceptor(taskApi);