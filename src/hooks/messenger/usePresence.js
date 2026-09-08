import {
    useEffect, useState
} from "react";

import {
    getOnlineUsers
} from "../../api/messenger/presenceApi.js";

import {
    createOnlineUsersSet, subscribeToPresence
} from "../../services/messenger/presenceService.js";


function usePresence(currentUsername) {


// =====================================================
// STATE
// =====================================================

    const [onlineUsers, setOnlineUsers] = useState(new Set());


// =====================================================
// PRESENCE
// =====================================================

    useEffect(() => {

        if (!currentUsername) {
            return;
        }


        let unsubscribe;


        const loadPresence = async () => {

            try {

                const users = await getOnlineUsers();


                setOnlineUsers(createOnlineUsersSet(users));

            } catch (error) {

                console.error("Ошибка загрузки presence:", error);

            }

        };


        loadPresence();


        unsubscribe = subscribeToPresence(({
                                               username, online
                                           }) => {

            if (!username) {
                return;
            }


            setOnlineUsers(previous => {

                const next = new Set(previous);


                const normalized = username
                    .trim()
                    .toLowerCase();


                if (online) {

                    next.add(normalized);

                } else {

                    next.delete(normalized);

                }


                return next;

            });

        });


        return () => {

            if (typeof unsubscribe === "function") {

                unsubscribe();

            }

        };

    }, [currentUsername]);


// =====================================================
// RETURN
// =====================================================

    return {

        onlineUsers,

        setOnlineUsers

    };

}


export default usePresence;