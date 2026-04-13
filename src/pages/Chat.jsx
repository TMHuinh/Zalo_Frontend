import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatList from "../components/ChatList";
import ChatMain from "../components/ChatMain";
import ContactsPanel from "../components/ContactsPanel";
import ContactsContent from "../components/ContactsContent";
import socket from "../socket/socket";
import "../css/chat.css";
import { getUserIdFromToken } from "../utils/auth";
import conversationApi from "../api/conversationApi";

function Chat() {
  const [tab, setTab] = useState("chat");
  const [activeConversation, setActiveConversation] = useState(null);
  const [contactView, setContactView] = useState("friends");
  const [search, setSearch] = useState("");

  // 🔥 state chính (nguồn dữ liệu duy nhất)
  const [conversations, setConversations] = useState([]);

  const currentUserId = getUserIdFromToken();

  // =========================
  // JOIN SOCKET
  // =========================
  useEffect(() => {
    if (currentUserId) {
      socket.emit("join", currentUserId);
    }
  }, [currentUserId]);

  // =========================
  // FETCH CONVERSATIONS (QUAN TRỌNG)
  // =========================
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await conversationApi.getConversations();
        setConversations(res.data.result);
      } catch (err) {
        console.log(err);
      }
    };

    fetchConversations();
  }, []);

  // =========================
  // RESET KHI SANG CONTACT
  // =========================
  useEffect(() => {
    if (tab === "contacts") {
      setActiveConversation(null);
    }
  }, [tab]);

  // =========================
  // 🔥 UPDATE KHI CÓ MESSAGE (SEND + RECEIVE)
  // =========================
  const handleNewMessage = ({ conversationId, message }) => {
    setConversations((prev) => {
      const updated = [...prev];

      const index = updated.findIndex((c) => c._id === conversationId);

      // ❌ nếu chưa có → thêm mới (fix bug của bạn)
      if (index === -1) {
        return [
          {
            _id: conversationId,
            lastMessageId: message,
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      }

      const conv = updated[index];

      const updatedConv = {
        ...conv,
        lastMessageId: message,
        updatedAt: new Date().toISOString(),
      };

      // 👉 đưa lên đầu list (giống Messenger/Zalo)
      updated.splice(index, 1);
      updated.unshift(updatedConv);

      return updated;
    });
  };

  // =========================
  // SOCKET RECEIVE GLOBAL (OPTIONAL - XỊN HƠN)
  // =========================
  useEffect(() => {
    const handleReceive = (data) => {
      // data nên chứa: conversationId + message
      if (!data?.conversationId || !data?.message) return;

      handleNewMessage(data);
    };

    socket.on("receive_message", handleReceive);

    return () => socket.off("receive_message", handleReceive);
  }, []);

  // =========================
  // RENDER
  // =========================
  return (
    <div className="chat-layout">
      <Sidebar tab={tab} setTab={setTab} />

      {/* LEFT */}
      <div className="chat-left-column">
        {tab === "chat" ? (
          <ChatList
            conversations={conversations}
            setConversations={setConversations}
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

      {/* RIGHT */}
      <div className="chat-right-column">
        {tab === "chat" ? (
          activeConversation ? (
            <ChatMain
              key={activeConversation._id}
              conversation={activeConversation}
              currentUserId={currentUserId}
              onNewMessage={handleNewMessage} // 🔥 QUAN TRỌNG
            />
          ) : (
            <div className="empty-state">
              <h3>Zalo Web</h3>
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )
        ) : (
          <ContactsContent
            view={contactView}
            search={search}
            currentUserId={currentUserId}
            onSelectConversation={(conv) => {
              setActiveConversation(conv);
              setTab("chat");
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Chat;