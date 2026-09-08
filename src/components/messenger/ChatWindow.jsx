import ChatHeader from "./ChatHeader.jsx";

import MessagesList from "./MessagesList.jsx";

import MessageInput from "./MessageInput.jsx";


function ChatWindow({

                        currentUsername,

                        selectedUsername,

                        selectedAvatar,

                        onlineUsers,

                        messages,

                        loadingMessages,

                        loadingOlderMessages,

                        messagesContainerRef,

                        onScroll,

                        onSendMessage,

                        onClose

                    }) {

    return (

        <>

            <ChatHeader
                selectedUsername={selectedUsername}
                selectedAvatar={selectedAvatar}
                onlineUsers={onlineUsers}
                onClose={onClose}
            />


            <MessagesList
                messages={messages}
                currentUsername={currentUsername}
                loadingMessages={loadingMessages}
                loadingOlderMessages={loadingOlderMessages}
                containerRef={messagesContainerRef}
                onScroll={onScroll}
            />


            <MessageInput
                onSendMessage={onSendMessage}
            />

        </>

    );

}


export default ChatWindow;