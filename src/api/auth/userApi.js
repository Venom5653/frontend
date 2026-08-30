import {authApi} from "../api.js";

export const getCurrentUser = async () => {

    const response =
        await authApi.get("/users/me");

    return response.data;
};

export const updateUsername = async (username) => {

    const response =
        await authApi.patch(
            "/users/username",
            {
                username
            }
        );

    return response.data;
};

export const updatePassword = async (
    oldPassword,
    newPassword
) => {

    const response =
        await authApi.patch(
            "/users/password",
            {
                oldPassword,
                newPassword
            }
        );

    return response.data;
};

export const deleteCurrentUser = async () => {

    await authApi.delete("/users/me");
};

export const updateAvatar = async (file) => {

    const formData = new FormData();

    formData.append("file", file);

    const response =
        await authApi.post(
            "/users/avatar",
            formData
        );

    return response.data;
};

export const deleteAvatar = async () => {

    await authApi.delete("/users/avatar");
};