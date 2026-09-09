import React, {useState} from "react";

import {searchUser} from "../../api/messenger/groupChatApi.js";

import "./GroupChatModal.css";


const GroupChatModal = ({
                            onClose,
                            onCreateGroup,
                            currentUsername
                        }) => {

    const [name, setName] = useState("");

    const [username, setUsername] = useState("");

    const [selectedUsers, setSelectedUsers] = useState([]);

    const [searchError, setSearchError] = useState("");

    const [loading, setLoading] = useState(false);


    // =====================================================
    // SEARCH USER
    // =====================================================

    const handleSearchUser = async () => {

        const value = username.trim();

        if (!value) {
            return;
        }

        setSearchError("");

        if (
            currentUsername &&
            value.toLowerCase() ===
            currentUsername.toLowerCase()
        ) {
            setSearchError("Нельзя добавить самого себя");
            return;
        }

        if (
            selectedUsers.some(
                user =>
                    user.username.toLowerCase() ===
                    value.toLowerCase()
            )
        ) {
            setSearchError("Пользователь уже добавлен");
            return;
        }

        try {

            setLoading(true);

            const user = await searchUser(value);

            if (!user) {
                setSearchError("Пользователь не найден");
                return;
            }

            setSelectedUsers(previous => [
                ...previous,
                user
            ]);

            setUsername("");

        } catch (error) {

            console.error(
                "Ошибка поиска пользователя:",
                error
            );

            setSearchError(
                error.response?.data?.message ||
                "Пользователь не найден"
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // ENTER
    // =====================================================

    const handleKeyDown = event => {

        if (event.key !== "Enter") {
            return;
        }


        event.preventDefault();

        handleSearchUser();

    };


    // =====================================================
    // REMOVE USER
    // =====================================================

    const handleRemoveUser = userId => {

        setSelectedUsers(previous =>
            previous.filter(
                user =>
                    Number(user.id) !== Number(userId)
            )
        );

    };


    // =====================================================
    // CREATE GROUP
    // =====================================================

    const handleCreateGroup = async () => {

        const groupName = name.trim();


        if (!groupName) {
            return;
        }


        if (selectedUsers.length === 0) {
            setSearchError(
                "Добавьте хотя бы одного участника"
            );
            return;
        }


        await onCreateGroup(
            groupName,
            selectedUsers.map(user => user.id)
        );

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="group-modal-overlay">

            <div className="group-modal">

                <div className="group-modal-header">

                    <h2>
                        Новая группа
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                    >
                        ×
                    </button>

                </div>


                {/* =================================================
                    GROUP NAME
                ================================================= */}

                <input
                    type="text"
                    placeholder="Название группы"
                    value={name}
                    onChange={event =>
                        setName(event.target.value)
                    }
                />


                {/* =================================================
                    SEARCH USER
                ================================================= */}

                <div className="group-user-search">

                    <input
                        type="text"
                        placeholder="Добавить пользователя"
                        value={username}
                        onChange={event =>
                            setUsername(event.target.value)
                        }
                        onKeyDown={handleKeyDown}
                    />

                    <button
                        type="button"
                        onClick={handleSearchUser}
                        disabled={loading}
                    >
                        {loading ? "..." : "+"}
                    </button>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {searchError && (

                    <div className="group-modal-error">
                        {searchError}
                    </div>

                )}


                {/* =================================================
                    SELECTED USERS
                ================================================= */}

                <div className="group-selected-users">

                    {selectedUsers.map(user => (

                        <div
                            className="group-selected-user"
                            key={user.id}
                        >

                            <span>
                                {user.username}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    handleRemoveUser(user.id)
                                }
                            >
                                ×
                            </button>

                        </div>

                    ))}

                </div>


                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="group-modal-actions">

                    <button
                        type="button"
                        onClick={onClose}
                    >
                        Отмена
                    </button>

                    <button
                        type="button"
                        onClick={handleCreateGroup}
                        disabled={
                            !name.trim() ||
                            selectedUsers.length === 0
                        }
                    >
                        Создать
                    </button>

                </div>

            </div>

        </div>

    );

};


export default GroupChatModal;