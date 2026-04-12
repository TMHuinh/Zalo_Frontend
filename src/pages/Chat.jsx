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
  const currentUserId = getUserIdFromToken();

  useEffect(() => {
    if (currentUserId) {
      socket.emit("join", currentUserId);
    }
  }, [currentUserId]);

  return (
    <div className="chat-layout">
      {/* 1. Thanh Sidebar ngoài cùng */}
      <Sidebar tab={tab} setTab={setTab} />

      {/* 2. Cột Danh sách (Cố định chiều rộng) */}
      <div className="chat-left-column">
        {tab === "chat" ? (
          <ChatList
            onSelectConversation={setActiveConversation}
            activeConversationId={activeConversation?._id}
          />
        ) : (
          <ContactsPanel />
        )}
      </div>

      {/* 3. Cột Nội dung Chat (Chiếm phần còn lại) */}
      <div className="chat-right-column">
        {activeConversation ? (
          <ChatMain
            conversation={activeConversation}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="empty-state">
            <h3>Zalo Web</h3>
            <p>Chọn một tin nhắn để bắt đầu trò chuyện</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
