import { useState, useEffect, useCallback } from "react";
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

  // Đưa fetchConversations vào useCallback để không bị cảnh báo dependency
  const fetchConversations = useCallback(async () => {
    try {
      const res = await conversationApi.getByUserId();
      const sorted = (res.data.result || []).sort(
        (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );
      setConversations(sorted);
      
      // Join vào tất cả các room nhóm/cá nhân để nhận realtime
      sorted.forEach((conv) => {
        socket.emit("join_conversation", conv._id);
      });
    } catch (err) {
      console.error("Lỗi khi tải danh sách chat:", err);
    }
  }, []);

  // 0. TRÌNH QUẢN LÝ KẾT NỐI SOCKET (TỰ ĐỘNG RECONNECT KHI RỚT MẠNG/NGỦ ĐÔNG TAB)
  useEffect(() => {
    if (!currentUserId) return;

    const handleSocketConnect = () => {
      console.log("🔥 Socket đã kết nối! Đang join lại các rooms...");
      socket.emit("join", currentUserId); // Join room user cá nhân
      fetchConversations(); // Lấy data mới nhất và join lại các room chat
    };

    // Nếu socket đã connect sẵn thì gọi luôn
    if (socket.connected) {
      handleSocketConnect();
    }

    // Lắng nghe sự kiện connect (chạy khi mới vào web hoặc khi có mạng lại)
    socket.on("connect", handleSocketConnect);
    socket.on("reconnect", handleSocketConnect);

    return () => {
      socket.off("connect", handleSocketConnect);
      socket.off("reconnect", handleSocketConnect);
    };
  }, [currentUserId, fetchConversations]);

  useEffect(() => {
    if (tab === "contacts") {
      setActiveConversation(null);
    }
  }, [tab]);

  const handleCloseConversation = useCallback((conversationId) => {
    setActiveConversation((prev) => (prev?._id === conversationId ? null : prev));
    setConversations((prev) => prev.filter((c) => c._id !== conversationId));
  }, []);

  // 1. TỐI ƯU GIAO DIỆN (OPTIMISTIC UI): Xử lý tin nhắn do chính bạn gửi đi
  const handleLocalNewMessage = useCallback(({ conversationId, message }) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c._id === conversationId);
      if (idx === -1) return prev;
      
      const updated = [...prev];
      // Nếu đã cập nhật rồi thì bỏ qua để chống giật UI
      if (updated[idx].lastMessageId?._id === message._id) return prev;

      updated[idx] = {
        ...updated[idx],
        lastMessageId: message,
        updatedAt: message.createdAt || new Date().toISOString(),
      };
      const [moved] = updated.splice(idx, 1);
      return [moved, ...updated];
    });

    setActiveConversation((prev) =>
      prev?._id === conversationId
        ? { ...prev, lastMessageId: message, updatedAt: message.createdAt || new Date().toISOString() }
        : prev
    );
  }, []);

  const handleLocalMessageRecalled = useCallback(({ conversationId, messageId }) => {
    const updateLastMsg = (prevMsg) => ({ ...prevMsg, isRecalled: true, content: "", attachments: [], type: "text" });
    setConversations((prev) => prev.map((conv) => {
      if (conv._id === conversationId && conv.lastMessageId?._id === messageId) {
        return { ...conv, lastMessageId: updateLastMsg(conv.lastMessageId), updatedAt: new Date().toISOString() };
      }
      return conv;
    }));
    setActiveConversation((prev) => {
      if (prev?._id === conversationId && prev.lastMessageId?._id === messageId) {
        return { ...prev, lastMessageId: updateLastMsg(prev.lastMessageId) };
      }
      return prev;
    });
  }, []);

  // 2. SOCKET RECEIVE: Nhận tin nhắn từ người khác
  useEffect(() => {
    const handleIncomingMessage = (data) => {
      const msg = data.message || data; 
      if (!msg?._id) return;
      const convId = msg.conversationId?._id || msg.conversationId;
      if (!convId) return;

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === convId);
        if (idx === -1) return prev;

        const updated = [...prev];
        // CHỐNG GIẬT: Nếu tin nhắn đã có (do Optimistic UI ở trên chạy trước) thì không xếp lại nữa
        if (updated[idx].lastMessageId?._id === msg._id) return prev;

        updated[idx] = {
          ...updated[idx],
          lastMessageId: msg,
          updatedAt: msg.createdAt || new Date().toISOString(),
        };
        const [moved] = updated.splice(idx, 1);
        return [moved, ...updated];
      });

      setActiveConversation((prev) =>
        prev?._id === convId && prev.lastMessageId?._id !== msg._id
          ? { ...prev, lastMessageId: msg, updatedAt: msg.createdAt || new Date().toISOString() }
          : prev
      );
    };

    const handleNewConversation = (conv) => {
      if (!conv?._id) return;
      socket.emit("join_conversation", conv._id);
      setConversations((prev) => prev.some((c) => c._id === conv._id) ? prev : [conv, ...prev]);
    };

    const handleGroupUpdated = (updatedConversation) => {
      if (!updatedConversation?._id) return;
      setConversations((prev) =>
        prev.map((c) => (c._id === updatedConversation._id ? { ...c, ...updatedConversation } : c))
      );
      setActiveConversation((prev) =>
        prev?._id === updatedConversation._id ? { ...prev, ...updatedConversation } : prev
      );
    };

    const handleGroupLost = ({ conversationId }) => {
      if (!conversationId) return;
      setActiveConversation((prev) => (prev?._id === conversationId ? null : prev));
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    };

    socket.on("receive_message", handleIncomingMessage);
    socket.on("receive_group_message", handleIncomingMessage);
    socket.on("new_message", handleIncomingMessage);
    socket.on("message_recalled", handleLocalMessageRecalled);
    socket.on("new_conversation", handleNewConversation);
    socket.on("group_updated", handleGroupUpdated);
    socket.on("removed_from_group", handleGroupLost);
    socket.on("group_disbanded", handleGroupLost);

    return () => {
      socket.off("receive_message", handleIncomingMessage);
      socket.off("receive_group_message", handleIncomingMessage);
      socket.off("new_message", handleIncomingMessage);
      socket.off("message_recalled", handleLocalMessageRecalled);
      socket.off("new_conversation", handleNewConversation);
      socket.off("group_updated", handleGroupUpdated);
      socket.off("removed_from_group", handleGroupLost);
      socket.off("group_disbanded", handleGroupLost);
    };
  }, [handleLocalMessageRecalled]); // Array phụ thuộc chỉ chứa hàm useCallback, KHÔNG chứa State để chống đứt kết nối

  return (
    <div className="chat-layout">
      <Sidebar tab={tab} setTab={setTab} />
      <div className="chat-left-column">
        {tab === "chat" ? (
          <ChatList
            conversations={conversations}
            setConversations={setConversations}
            onSelectConversation={setActiveConversation}
            activeConversationId={activeConversation?._id}
          />
        ) : (
          <ContactsPanel contactView={contactView} setContactView={setContactView} onSearch={setSearch} />
        )}
      </div>

      <div className="chat-right-column">
        {tab === "chat" ? (
          activeConversation ? (
            <ChatMain
              key={activeConversation._id}
              conversation={activeConversation}
              currentUserId={currentUserId}
              onCloseConversation={handleCloseConversation}
              onNewMessage={handleLocalNewMessage}         
              onMessageRecalled={handleLocalMessageRecalled} 
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