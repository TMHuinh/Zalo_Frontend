import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatList from "../components/ChatList";
import ChatMain from "../components/ChatMain";
import ContactsPanel from "../components/ContactsPanel";
import socket from "../socket/socket";
import "../css/chat.css";
import { getUserIdFromToken } from "../utils/auth";

function Chat() {
  const [tab, setTab] = useState("chat");
  const [activeConversation, setActiveConversation] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // 🔥 ĐỔI TÊN CHO ĐÚNG BẢN CHẤT


  const currentUserId = getUserIdFromToken();

  useEffect(() => {
    if (currentUserId) {
      socket.emit("join", currentUserId);
    }
  }, [currentUserId]);

  return (
    <div className="chat-container">
      <Sidebar tab={tab} setTab={setTab} />

      {tab === "chat" && (
        <ChatList
          onSelectConversation={setActiveConversation} // ✅ sửa lại
          activeConversationId={activeConversation?._id}
          isTyping={isTyping}
        />
      )}

      {tab === "contacts" && <ContactsPanel />}

      <ChatMain
        conversation={activeConversation}
        currentUserId={currentUserId}
        setIsTyping={setIsTyping}
      />
    </div>
  );
}

export default Chat;
