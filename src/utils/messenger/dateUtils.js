export const formatTime = date => {

    if (!date) {
        return "";
    }


    const parsed = new Date(date);


    if (Number.isNaN(parsed.getTime())) {

        return "";

    }


    return parsed.toLocaleTimeString("ru-RU", {
        hour: "2-digit", minute: "2-digit"
    });

};