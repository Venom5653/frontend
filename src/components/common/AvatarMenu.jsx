import {useState} from "react";
import {useNavigate} from "react-router-dom";

function AvatarMenu() {

    const navigate = useNavigate();

    const [isOpen, setIsOpen] =
        useState(false);

    const username =
        localStorage.getItem("username") || "U";

    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");

        navigate("/login");
    };

    return (

        <div
            className="avatar-menu"
            onMouseEnter={() =>
                setIsOpen(true)
            }
            onMouseLeave={() =>
                setIsOpen(false)
            }
        >

            <button
                className="avatar-button"
                onClick={() =>
                    setIsOpen(!isOpen)
                }
            >

                {username.charAt(0).toUpperCase()}

            </button>


            {isOpen && (

                <div className="avatar-dropdown">

                    <button
                        onClick={() =>
                            navigate("/profile")
                        }
                    >
                        👤 Профиль
                    </button>

                    <button
                        className="dropdown-logout"
                        onClick={handleLogout}
                    >
                        🚪 Выйти
                    </button>

                </div>

            )}

        </div>

    );

}

export default AvatarMenu;
