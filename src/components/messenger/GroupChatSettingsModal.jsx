import {
    useEffect, useRef, useState
} from "react";

import {
    searchUser
} from "../../api/messenger/groupChatApi.js";

import {
    getAvatarUrl, getAvatarLetter
} from "../../utils/chatUtils.js";

import "./GroupChatSettingsModal.css";


function GroupChatSettingsModal({
                                    chat,
                                    currentUserId,
                                    onClose,
                                    onUpdateGroup,
                                    onUploadAvatar,
                                    onDeleteAvatar,
                                    onAddMember,
                                    onRemoveMember,
                                    onChangeRole,
                                    onTransferOwnership,
                                    onLeaveGroup,
                                    onDeleteGroup
                                }) {

    const [name, setName] = useState(chat?.name || "");
    const [username, setUsername] = useState("");
    const [searchError, setSearchError] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [groupAvatarError, setGroupAvatarError] = useState(false);
    const [memberAvatarErrors, setMemberAvatarErrors] = useState({});

    const fileInputRef = useRef(null);


    useEffect(() => {

        setName(chat?.name || "");
        setGroupAvatarError(false);
        setMemberAvatarErrors({});

    }, [chat?.name, chat?.avatar, chat?.members]);


    const members = chat?.members || [];

    const getRoleLabel = role => {
        if (role === "OWNER") {
            return "Владелец";
        }

        if (role === "ADMIN") {
            return "Администратор";
        }

        if (role === "MEMBER") {
            return "Участник";
        }

        return role;
    };

    const currentMember = members.find(member => Number(member.userId) === Number(currentUserId));


    const currentRole = currentMember?.role || "MEMBER";


    const isOwner = currentRole === "OWNER";


    const isAdmin = currentRole === "ADMIN";


    const canManageMembers = isOwner || isAdmin;


    const canEditGroup = isOwner || isAdmin;


    const groupAvatarUrl = getAvatarUrl(chat?.avatar);


    const handleUpdateGroup = async () => {

        const value = name.trim();


        if (!value) {

            setError("Название группы не может быть пустым");

            return;

        }


        try {

            setLoading(true);

            setError("");

            await onUpdateGroup(value);

        } catch (error) {

            setError(error.response?.data?.message || "Не удалось изменить группу");

        } finally {

            setLoading(false);

        }

    };


    const handleAvatarClick = () => {

        if (!canEditGroup) {
            return;
        }

        fileInputRef.current?.click();

    };


    const handleAvatarChange = async event => {

        const file = event.target.files?.[0];


        event.target.value = "";


        if (!file) {
            return;
        }


        if (!file.type.startsWith("image/")) {

            setError("Можно загрузить только изображение");

            return;

        }


        try {

            setAvatarLoading(true);

            setError("");

            setGroupAvatarError(false);

            await onUploadAvatar(file);

        } catch (error) {

            setError(error.response?.data?.message || "Не удалось загрузить аватар");

        } finally {

            setAvatarLoading(false);

        }

    };


    const handleDeleteAvatar = async () => {

        try {

            setAvatarLoading(true);

            setError("");

            setGroupAvatarError(false);

            await onDeleteAvatar();

        } catch (error) {

            setError(error.response?.data?.message || "Не удалось удалить аватар");

        } finally {

            setAvatarLoading(false);

        }

    };


    const handleSearchUser = async () => {

        const value = username.trim();


        if (!value) {
            return;
        }


        setSearchError("");


        const exists = members.some(member => member.username?.toLowerCase() === value.toLowerCase());


        if (exists) {

            setSearchError("Пользователь уже состоит в группе");

            return;

        }


        try {

            setLoading(true);


            const user = await searchUser(value);


            if (!user) {

                setSearchError("Пользователь не найден");

                return;

            }


            await onAddMember(user.id);

            setUsername("");

        } catch (error) {

            setSearchError(error.response?.data?.message || "Не удалось добавить пользователя");

        } finally {

            setLoading(false);

        }

    };


    const handleSearchKeyDown = event => {

        if (event.key !== "Enter") {
            return;
        }


        event.preventDefault();

        handleSearchUser();

    };


    const handleRemoveMember = async userId => {

        try {

            setLoading(true);

            setError("");

            await onRemoveMember(userId);

        } catch (error) {

            setError(error.response?.data?.message || "Не удалось удалить участника");

        } finally {

            setLoading(false);

        }

    };


    const handleRoleChange = async (userId, role) => {

        try {

            setLoading(true);

            setError("");

            await onChangeRole(userId, role);

        } catch (error) {

            setError(error.response?.data?.message || "Не удалось изменить роль");

        } finally {

            setLoading(false);

        }

    };


    const handleTransferOwnership = async userId => {

        try {

            setLoading(true);

            setError("");

            await onTransferOwnership(userId);

        } catch (error) {

            setError(error.response?.data?.message || "Не удалось передать права владельца");

        } finally {

            setLoading(false);

        }

    };


    const executeConfirmAction = async () => {

        if (!confirmAction) {
            return;
        }


        const action = confirmAction;


        setConfirmAction(null);


        try {

            setLoading(true);

            setError("");


            if (action.type === "remove") {

                await handleRemoveMember(action.userId);

            }


            if (action.type === "transfer") {

                await handleTransferOwnership(action.userId);

            }


            if (action.type === "leave") {

                await onLeaveGroup();

                onClose();

                return;

            }


            if (action.type === "delete") {

                await onDeleteGroup();

                onClose();

                return;

            }

        } finally {

            setLoading(false);

        }

    };


    const getConfirmText = () => {

        if (!confirmAction) {
            return "";
        }


        if (confirmAction.type === "remove") {

            return "Удалить участника из группы?";

        }


        if (confirmAction.type === "transfer") {

            return "Передать права владельца этому участнику?";

        }


        if (confirmAction.type === "leave") {

            return "Выйти из группы?";

        }


        if (confirmAction.type === "delete") {

            return "Удалить группу? Это действие нельзя отменить.";

        }


        return "";

    };


    const handleMemberAvatarError = userId => {

        setMemberAvatarErrors(previous => ({
            ...previous, [userId]: true
        }));

    };


    return (

        <div
            className="group-settings-overlay"
            onMouseDown={event => {

                if (event.target === event.currentTarget) {

                    onClose();

                }

            }}
        >

            <div className="group-settings-modal">

                <div className="group-settings-header">

                    <h2>
                        Настройки группы
                    </h2>

                    <button
                        type="button"
                        className="group-settings-close"
                        onClick={onClose}
                    >
                        ×
                    </button>

                </div>


                <div className="group-settings-content">

                    {error && (

                        <div className="group-settings-error">
                            {error}
                        </div>

                    )}


                    <section className="group-settings-section">

                        <div className="group-settings-avatar-wrapper">

                            <div className="group-settings-avatar">

                                {groupAvatarUrl && !groupAvatarError ? (

                                    <img
                                        src={groupAvatarUrl}
                                        alt={chat?.name || "Группа"}
                                        onError={() => setGroupAvatarError(true)}
                                    />

                                ) : (

                                    <span>
                                        {getAvatarLetter(chat?.name)}
                                    </span>

                                )}

                            </div>


                            {canEditGroup && (

                                <div className="group-settings-avatar-actions">

                                    <button
                                        type="button"
                                        onClick={handleAvatarClick}
                                        disabled={avatarLoading}
                                    >
                                        {avatarLoading ? "Загрузка..." : "Изменить аватар"}
                                    </button>


                                    {chat?.avatar && (

                                        <button
                                            type="button"
                                            onClick={handleDeleteAvatar}
                                            disabled={avatarLoading}
                                        >
                                            Удалить
                                        </button>

                                    )}

                                </div>

                            )}


                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="group-settings-file-input"
                                onChange={handleAvatarChange}
                            />

                        </div>

                    </section>


                    <section className="group-settings-section">

                        <h3>
                            Название
                        </h3>


                        <div className="group-settings-name">

                            <input
                                type="text"
                                value={name}
                                onChange={event => setName(event.target.value)}
                                disabled={!canEditGroup || loading}
                                maxLength={255}
                            />


                            {canEditGroup && (

                                <button
                                    type="button"
                                    onClick={handleUpdateGroup}
                                    disabled={loading}
                                >
                                    Сохранить
                                </button>

                            )}

                        </div>

                    </section>


                    <section className="group-settings-section">

                        <div className="group-settings-section-title">

                            <h3>
                                Участники
                            </h3>

                            <span>
                                {members.length}
                            </span>

                        </div>


                        {canManageMembers && (

                            <div className="group-settings-add-member">

                                <input
                                    type="text"
                                    value={username}
                                    onChange={event => setUsername(event.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Username"
                                    disabled={loading}
                                />


                                <button
                                    type="button"
                                    onClick={handleSearchUser}
                                    disabled={loading || !username.trim()}
                                >
                                    Добавить
                                </button>

                            </div>

                        )}


                        {searchError && (

                            <div className="group-settings-search-error">
                                {searchError}
                            </div>

                        )}


                        <div className="group-settings-members">

                            {members.map(member => {

                                const memberIsOwner = member.role === "OWNER";


                                const memberIsAdmin = member.role === "ADMIN";


                                const isCurrentUser = Number(member.userId) === Number(currentUserId);


                                const canRemove = canManageMembers && !isCurrentUser && !memberIsOwner && (isOwner || (isAdmin && !memberIsAdmin));


                                const canChangeRole = isOwner && !isCurrentUser && !memberIsOwner;


                                const canTransfer = isOwner && !isCurrentUser && !memberIsOwner;


                                const memberAvatarUrl = getAvatarUrl(member.avatar);


                                const memberAvatarError = Boolean(memberAvatarErrors[member.userId]);


                                return (

                                    <div
                                        key={member.userId}
                                        className="group-settings-member"
                                    >

                                        <div className="group-settings-member-avatar">

                                            {memberAvatarUrl && !memberAvatarError ? (

                                                <img
                                                    src={memberAvatarUrl}
                                                    alt={member.username || "Avatar"}
                                                    onError={() => handleMemberAvatarError(member.userId)}
                                                />

                                            ) : (

                                                <span>
                                                    {getAvatarLetter(member.username)}
                                                </span>

                                            )}

                                        </div>


                                        <div className="group-settings-member-info">

                                            <strong>
                                                {member.username}
                                            </strong>

                                            <span>
                                                {getRoleLabel(member.role)}
                                            </span>

                                        </div>


                                        <div className="group-settings-member-actions">

                                            {canChangeRole && (

                                                <select
                                                    value={member.role}
                                                    disabled={loading}
                                                    onChange={event => handleRoleChange(member.userId, event.target.value)}
                                                >

                                                    <option value="MEMBER">
                                                        Участник
                                                    </option>

                                                    <option value="ADMIN">
                                                        Админ
                                                    </option>

                                                </select>

                                            )}


                                            {canTransfer && (

                                                <button
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={() => setConfirmAction({
                                                        type: "transfer", userId: member.userId
                                                    })}
                                                >
                                                    Передать
                                                </button>

                                            )}


                                            {canRemove && (

                                                <button
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={() => setConfirmAction({
                                                        type: "remove", userId: member.userId
                                                    })}
                                                >
                                                    Удалить
                                                </button>

                                            )}

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    </section>


                    <section className="group-settings-section group-settings-danger">

                        {!isOwner && (

                            <button
                                type="button"
                                className="group-settings-danger-button"
                                disabled={loading}
                                onClick={() => setConfirmAction({
                                    type: "leave"
                                })}
                            >
                                Выйти из группы
                            </button>

                        )}


                        {isOwner && (

                            <button
                                type="button"
                                className="group-settings-danger-button"
                                disabled={loading}
                                onClick={() => setConfirmAction({
                                    type: "delete"
                                })}
                            >
                                Удалить группу
                            </button>

                        )}

                    </section>

                </div>

            </div>


            {confirmAction && (

                <div className="group-settings-confirm-overlay">

                    <div className="group-settings-confirm">

                        <p>
                            {getConfirmText()}
                        </p>


                        <div className="group-settings-confirm-actions">

                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                disabled={loading}
                            >
                                Отмена
                            </button>


                            <button
                                type="button"
                                className="group-settings-danger-button"
                                onClick={executeConfirmAction}
                                disabled={loading}
                            >
                                Подтвердить
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}


export default GroupChatSettingsModal;