import {
    createContext, useContext, useEffect, useState
} from "react";

import {
    connectWebSocket, disconnectWebSocket
} from "../services/messenger/websocketService.js";


const AuthContext = createContext(null);


export function AuthProvider({
                                 children
                             }) {

    const [token, setToken] = useState(() => localStorage.getItem("token"));


    useEffect(() => {

        if (!token) {

            disconnectWebSocket();

            return;
        }


        connectWebSocket(token);


        return () => {

            disconnectWebSocket();

        };

    }, [token]);

    const login = (accessToken, refreshToken) => {

        localStorage.setItem("token", accessToken);


        localStorage.setItem("refreshToken", refreshToken);


        setToken(accessToken);
    };

    const logout = () => {

        localStorage.removeItem("token");

        localStorage.removeItem("refreshToken");

        localStorage.removeItem("username");


        disconnectWebSocket();


        setToken(null);
    };


    return (

        <AuthContext.Provider
            value={{
                token,

                isAuthenticated: !!token,

                login,

                logout
            }}
        >

            {children}

        </AuthContext.Provider>);
}


export function useAuth() {

    return useContext(AuthContext);
}