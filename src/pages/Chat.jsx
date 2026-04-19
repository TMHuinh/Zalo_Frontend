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
      const sorted = (res.data.result || []).sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt),
      );

      setConversations(sorted);
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
        fetchConversations();
        return prev;
      }

      const conv = updated[index];
      const updatedConv = {
        ...conv,
        lastMessageId: message,
        updatedAt: new Date().toISOString(),
      };

      updated.splice(index, 1);
      updated.unshift(updatedConv);

      // 🔥 FIX: update activeConversation nếu đang mở
      if (activeConversation?._id === conversationId) {
        setActiveConversation(updatedConv);
      }

      return updated;
    });
  };

  const handleMessageRecalled = ({ conversationId, messageId }) => {
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv._id !== conversationId) return conv;

        if (conv.lastMessageId?._id === messageId) {
          return {
            ...conv,
            lastMessageId: {
              ...conv.lastMessageId,
              isRecalled: true,
              content: "",
              attachments: [],
              type: "text",
            },
            updatedAt: new Date().toISOString(),
          };
        }

        return conv;
      });

      return updated;
    });

    if (activeConversation?._id === conversationId) {
      setActiveConversation((prev) => {
        if (!prev) return prev;
        if (prev.lastMessageId?._id !== messageId) return prev;

        return {
          ...prev,
          lastMessageId: {
            ...prev.lastMessageId,
            isRecalled: true,
            content: "",
            attachments: [],
            type: "text",
          },
        };
      });
    }
  };

  // SOCKET RECEIVE
  useEffect(() => {
    const handleReceivePrivate = (data) => {
      if (!data?.message) return;
      if (data.userId === currentUserId) return;

      setConversations((prev) => {
        const index = prev.findIndex((c) =>
          c.members.some((m) => m.userId._id === data.userId),
        );

        if (index === -1) return prev;

        const updated = [...prev];
        const conv = updated[index];

        const updatedConv = {
          ...conv,
          lastMessageId: data.message,
          updatedAt: new Date().toISOString(),
        };

        updated.splice(index, 1);
        updated.unshift(updatedConv);

        return updated;
      });
    };

    const handleReceiveGroup = (data) => {
      if (!data?.message) return;

      setConversations((prev) => {
        const index = prev.findIndex(
          (c) => c._id === data.groupId, // 🔥 KHÁC Ở ĐÂY
        );

        if (index === -1) return prev;

        const updated = [...prev];
        const conv = updated[index];

        const updatedConv = {
          ...conv,
          lastMessageId: data.message,
          updatedAt: new Date().toISOString(),
        };

        updated.splice(index, 1);
        updated.unshift(updatedConv);

        return updated;
      });
    };

    const handleSocketMessageRecalled = ({ conversationId, messageId }) => {
      if (!conversationId || !messageId) return;

      handleMessageRecalled({ conversationId, messageId });
    };

    socket.on("message_recalled", handleSocketMessageRecalled);
    socket.on("receive_message", handleReceivePrivate);
    socket.on("receive_group_message", handleReceiveGroup);

    return () => {
      socket.off("receive_message", handleReceivePrivate);
      socket.off("receive_group_message", handleReceiveGroup);
      socket.off("message_recalled", handleSocketMessageRecalled);
    };
  }, [currentUserId, activeConversation]); // Thêm activeConversation vào dependency để đảm bảo logic cập nhật chuẩn

  return (
    <div className="chat-layout">
      <Sidebar tab={tab} setTab={setTab} />

      <div className="chat-left-column">
        {tab === "chat" ? (
          <ChatList
            conversations={conversations}
            setConversations={setConversations} // PHẢI CÓ DÒNG NÀY ĐỂ FIX LỖI "NOT A FUNCTION"
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
              onMessageRecalled={handleMessageRecalled}
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