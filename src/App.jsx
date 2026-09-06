import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import MessengerPage from "./pages/messenger/MessengerPage.jsx";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import ProfilePage from "./pages/profile/ProfilePage";

import TasksPage from "./pages/task/TasksPage";
import TaskCreatePage from "./pages/task/TaskCreatePage";

import ProtectedRoute from "./components/ProtectedRoute";

import AuthorizedLayout from "./components/layout/AuthorizedLayout.jsx";

import "./App.css";

function App() {


    return (

        <BrowserRouter>

            <Routes>


                {/* =============================================
                DEFAULT
            ============================================= */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/profile"
                            replace
                        />
                    }
                />


                {/* =============================================
                PUBLIC ROUTES
            ============================================= */}

                <Route
                    path="/login"
                    element={<LoginPage/>}
                />

                <Route
                    path="/register"
                    element={<RegisterPage/>}
                />


                {/* =============================================
                PROTECTED ROUTES
            ============================================= */}

                <Route
                    element={
                        <ProtectedRoute>

                            <AuthorizedLayout/>

                        </ProtectedRoute>
                    }
                >


                    {/* =========================================
                    MESSENGER
                ========================================= */}

                    <Route
                        path="/messenger"
                        element={<MessengerPage/>}
                    />


                    {/* =========================================
                    PROFILE
                ========================================= */}

                    <Route
                        path="/profile"
                        element={<ProfilePage/>}
                    />


                    {/* =========================================
                    TASKS
                ========================================= */}

                    <Route
                        path="/tasks"
                        element={<TasksPage/>}
                    />

                    <Route
                        path="/tasks/create"
                        element={<TaskCreatePage/>}
                    />


                </Route>


                {/* =============================================
                UNKNOWN ROUTES
            ============================================= */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/profile"
                            replace
                        />
                    }
                />


            </Routes>

        </BrowserRouter>

    );


}

export default App;
