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
  const [conversations, setConversations] = useState([]);

  const currentUserId = getUserIdFromToken();

  // JOIN SOCKET
  useEffect(() => {
    if (currentUserId) {
      socket.emit("join", currentUserId);
    }
  }, [currentUserId]);

  // FETCH CONVERSATIONS (FIXED TÊN HÀM)
  const fetchConversations = async () => {
    try {
      // Sửa tên hàm từ getConversations thành getByUserId
      const res = await conversationApi.getByUserId(); 
      // API của bạn trả về mảng nằm trong res.data.result
      setConversations(res.data.result || []); 
    } catch (err) {
      console.error("Lỗi khi tải danh sách chat:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // RESET KHI SANG CONTACT
  useEffect(() => {
    if (tab === "contacts") {
      setActiveConversation(null);
    }
  }, [tab]);

  // UPDATE KHI CÓ MESSAGE (SEND + RECEIVE)
  const handleNewMessage = ({ conversationId, message }) => {
    setConversations((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((c) => c._id === conversationId);

      if (index === -1) {
        // Nếu là cuộc hội thoại mới hoàn toàn
        fetchConversations(); // Tải lại toàn bộ cho chắc chắn dữ liệu đồng bộ
        return prev;
      }

      const conv = updated[index];
      const updatedConv = {
        ...conv,
        lastMessageId: message,
        updatedAt: new Date().toISOString(),
      };

      // Đưa lên đầu danh sách
      updated.splice(index, 1);
      updated.unshift(updatedConv);

      return updated;
    });
  };

  // SOCKET RECEIVE
  useEffect(() => {
    const handleReceive = (data) => {
      if (!data?.conversationId || !data?.message) return;
      handleNewMessage(data);
    };

    socket.on("receive_message", handleReceive);
    return () => socket.off("receive_message", handleReceive);
  }, []);

  return (
    <div className="chat-layout">
      <Sidebar tab={tab} setTab={setTab} />

      <div className="chat-left-column">
        {tab === "chat" ? (
          <ChatList
            conversations={conversations}
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
              key={activeConversation._id}
              conversation={activeConversation}
              currentUserId={currentUserId}
              onNewMessage={handleNewMessage}
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