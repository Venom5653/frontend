import {
    useCallback, useEffect, useState
} from "react";

import messengerApi from "../../api/messenger/messengerApi.js";


function useCurrentUser() {


// =====================================================
// STATE
// =====================================================

    const [currentUser, setCurrentUser] = useState(null);


    const [loadingCurrentUser, setLoadingCurrentUser] = useState(true);


// =====================================================
// CURRENT USERNAME
// =====================================================

    const currentUsername = currentUser?.username || null;


// =====================================================
// LOAD CURRENT USER
// =====================================================

    const loadCurrentUser = useCallback(async () => {

        try {

            setLoadingCurrentUser(true);


            const response = await messengerApi.get("/api/users/me");


            const user = response.data;


            setCurrentUser(user);


            if (user?.username) {

                localStorage.setItem("username", user.username);

            }


            return user;

        } catch (error) {

            console.error("Ошибка загрузки текущего пользователя:", error);


            setCurrentUser(null);


            return null;

        } finally {

            setLoadingCurrentUser(false);

        }

    }, []);


// =====================================================
// INITIAL LOAD
// =====================================================

    useEffect(() => {

        loadCurrentUser();

    }, [loadCurrentUser]);


// =====================================================
// RETURN
// =====================================================

    return {

        currentUser,

        currentUsername,

        loadingCurrentUser,

        loadCurrentUser

    };

}


export default useCurrentUser;