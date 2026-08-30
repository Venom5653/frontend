import axios from "axios";

let refreshPromise = null;

const createApiClient = (baseURL) => {

    const api = axios.create({
        baseURL, headers: {
            "Content-Type": "application/json"
        }
    });

    api.interceptors.request.use((config) => {

        const token = localStorage.getItem("token");

        if (token) {

            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    });

    api.interceptors.response.use((response) => response,

        async (error) => {

            const originalRequest = error.config;

            if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes("/auth/refresh")) {

                originalRequest._retry = true;

                try {

                    const newToken = await refreshAccessToken();

                    originalRequest.headers.Authorization = `Bearer ${newToken}`;

                    return api(originalRequest);

                } catch (refreshError) {

                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");

                    window.location.href = "/login";

                    return Promise.reject(refreshError);
                }
            }

            return Promise.reject(error);
        });

    return api;
};


const authApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL, headers: {
        "Content-Type": "application/json"
    }
});


const refreshAccessToken = async () => {

    if (refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
        throw new Error("Refresh token отсутствует");
    }

    refreshPromise = authApi.post("/auth/refresh", null, {
        params: {
            refreshToken
        }
    })
        .then((response) => {

            const accessToken = response.data.accessToken;

            const newRefreshToken = response.data.refreshToken;

            if (!accessToken) {
                throw new Error("Access token отсутствует в ответе");
            }

            localStorage.setItem("token", accessToken);

            if (newRefreshToken) {

                localStorage.setItem("refreshToken", newRefreshToken);
            }

            return accessToken;
        })
        .finally(() => {

            refreshPromise = null;
        });

    return refreshPromise;
};


export const authClient = createApiClient(import.meta.env.VITE_API_URL);


export const taskClient = createApiClient(import.meta.env.VITE_API_URL);