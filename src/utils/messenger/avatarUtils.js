const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";


export const getAvatarUrl = avatar => {

    if (!avatar || typeof avatar !== "string") {

        return null;

    }


    const value = avatar.trim();


    if (!value) {
        return null;
    }


    if (value.startsWith("http://") || value.startsWith("https://")) {

        return value;

    }


    if (value.startsWith("/")) {

        return `${API_URL}${value}`;

    }


    return `${API_URL}/${value}`;

};


export const getAvatarLetter = username => {

    if (!username) {
        return "?";
    }


    return username
        .trim()
        .charAt(0)
        .toUpperCase();

};