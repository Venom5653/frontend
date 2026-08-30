import axios from "axios";

import {
    refreshAccessToken
} from "../api.js";

import {
    reconnectWebSocket
} from "../../services/messenger/websocketService.js";


const messengerApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});


messengerApi.interceptors.request.use(config => {

        const token = localStorage.getItem("token");

        if (token) {

            config.headers = config.headers || {};

            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },

    error => Promise.reject(error));


messengerApi.interceptors.response.use(response => response,

    async error => {

        const originalRequest = error.config;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        if (error.response?.status === 403) {

            console.error("Messenger API: 403 Forbidden");

            return Promise.reject(error);
        }

        if (error.response?.status !== 401) {

            return Promise.reject(error);
        }

        if (originalRequest._retry) {

            return Promise.reject(error);
        }

        originalRequest._retry = true;

        console.log("Messenger: access token истёк. Обновляем...");

        try {

            const newAccessToken = await refreshAccessToken();

            console.log("Messenger: access token обновлён");

            try {

                await reconnectWebSocket(newAccessToken);

            } catch (websocketError) {

                console.error("Messenger: ошибка WebSocket reconnect:", websocketError);
            }

            originalRequest.headers = originalRequest.headers || {};

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return messengerApi(originalRequest);

        } catch (refreshError) {

            console.error("Messenger: refresh failed:", refreshError);

            return Promise.reject(refreshError);
        }
    });


export default messengerApi;