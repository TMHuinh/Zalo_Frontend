import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatList from "../components/ChatList";
import ChatMain from "../components/ChatMain";
import ContactsPanel from "../components/ContactsPanel";
import ContactsContent from "../components/ContactsContent";
import socket from "../socket/socket";
import "../css/chat.css";
import { getUserIdFromToken } from "../utils/auth";

function Chat() {
  const [tab, setTab] = useState("chat");
  const [activeConversation, setActiveConversation] = useState(null);
  const [contactView, setContactView] = useState("friends");
  const [search, setSearch] = useState("");

  const currentUserId = getUserIdFromToken();

  useEffect(() => {
    if (currentUserId) {
      socket.emit("join", currentUserId);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (tab === "contacts") {
      setActiveConversation(null);
    }
  }, [tab]);

  return (
    <div className="chat-layout">
      <Sidebar tab={tab} setTab={setTab} />

      <div className="chat-left-column">
        {tab === "chat" ? (
          <ChatList
            onSelectConversation={setActiveConversation}
            activeConversationId={activeConversation?._id}
          />
        ) : (
          <ContactsPanel
            contactView={contactView}
            setContactView={setContactView}
            onSearch={setSearch}
          />
        )}
      </div>

      <div className="chat-right-column">
        {tab === "chat" ? (
          activeConversation ? (
            <ChatMain
              key={activeConversation?._id}
              conversation={activeConversation}
              currentUserId={currentUserId}
            />
          ) : (
            <div className="empty-state">
              <h3>Zalo Web</h3>
              <p>Chọn một tin nhắn để bắt đầu trò chuyện</p>
            </div>
          )
        ) : (
          <ContactsContent
            view={contactView}
            search={search}
            currentUserId={currentUserId}
            onSelectConversation={(conv) => {
              setActiveConversation(conv);
              setTab("chat"); // 🔥 AUTO SWITCH
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Chat;