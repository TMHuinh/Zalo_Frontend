import { useEffect, useState } from "react";
import AddFriendModal from "../components/AddFriendModal";
import conversationApi from "../api/conversationApi";
import { getUserIdFromToken } from "../utils/auth";
import socket from "../socket/socket";
import "../css/chatList.css";

function ChatList({ onSelectConversation, activeConversationId }) {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [unread, setUnread] = useState({});

  const currentUserId = getUserIdFromToken();

  // =========================
  // LOAD CONVERSATIONS
  // =========================
  const fetchConversations = async () => {
    try {
      const res = await conversationApi.getByUserId();

      // ✅ sort mới nhất lên đầu
      const sorted = res.data.result.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt),
      );

      setConversations(sorted);
    } catch (err) {
      console.log("Load conversation error:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // =========================
  // RESET UNREAD khi click
  // =========================
  useEffect(() => {
    if (activeConversationId) {
      setUnread((prev) => ({
        ...prev,
        [activeConversationId]: 0,
      }));
    }
  }, [activeConversationId]);

  // =========================
  // SOCKET REALTIME
  // =========================
  useEffect(() => {
    const handleReceive = async (msg) => {
      // 🔥 reload conversation
      const res = await conversationApi.getByUserId();
      const newConversations = res.data.result;

      // sort lại
      const sorted = newConversations.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt),
      );

      setConversations(sorted);

      // 🔥 tìm đúng conversation
      const targetConv = sorted.find((conv) =>
        conv.members.some((m) => m.userId._id === msg.userId),
      );

      if (!targetConv) return;

      // ✅ nếu đang mở chat đó → không tăng unread
      if (targetConv._id === activeConversationId) {
        setUnread((prev) => ({
          ...prev,
          [targetConv._id]: 0,
        }));
        return;
      }

      // ❌ chưa mở → tăng badge
      setUnread((prev) => ({
        ...prev,
        [targetConv._id]: (prev[targetConv._id] || 0) + 1,
      }));
    };

    socket.on("receive_message", handleReceive);

    return () => socket.off("receive_message", handleReceive);
  }, [activeConversationId, currentUserId]);

  // =========================
  // FILTER
  // =========================
  const filtered = conversations.filter((c) => {
    const otherUser = c.members.find((m) => m.userId._id !== currentUserId);

    const name = otherUser?.userId?.fullName || "Unknown";

    return name.toLowerCase().includes(search.toLowerCase());
  });

  // =========================
  // UI
  // =========================
  return (
    <div className="chat-list">
      {/* SEARCH */}
      <div className="search-box" style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Tìm kiếm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />

        <button
          onClick={() => setOpenModal(true)}
          style={{
            padding: "6px 10px",
            background: "#0b74e5",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          + Bạn
        </button>
      </div>

      {/* LIST */}
      <div className="list">
        {filtered.map((conv) => {
          const otherUser = conv.members.find(
            (m) => m.userId._id !== currentUserId,
          );

          const user = otherUser?.userId;

          return (
            <div
              key={conv._id}
              className={`chat-item ${
                activeConversationId === conv._id ? "active" : ""
              }`}
              onClick={() => {
                // reset unread
                setUnread((prev) => ({
                  ...prev,
                  [conv._id]: 0,
                }));

                onSelectConversation?.(conv);
              }}
            >
              {/* AVATAR */}
              <div className="avatar-small">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="avatar-img"
                  />
                ) : (
                  <span>{user?.fullName?.charAt(0) || "?"}</span>
                )}
              </div>

              {/* INFO */}
              <div className="info">
                <p className="name">{user?.fullName}</p>

                <span className="last-msg">
                  {conv.lastMessageId?.content || "Chưa có tin nhắn"}
                </span>
              </div>

              {/* 🔴 BADGE */}
              {unread[conv._id] > 0 && (
                <div className="badge">
                  {unread[conv._id] > 9 ? "9+" : unread[conv._id]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {openModal && <AddFriendModal onClose={() => setOpenModal(false)} />}
    </div>
  );
}

export default ChatList;
