import { useEffect, useState, useMemo } from "react";
import {
  Form,
  Button,
  Badge,
  Row,
  Col,
  Image,
} from "react-bootstrap";
import AddFriendModal from "../components/AddFriendModal";
import conversationApi from "../api/conversationApi";
import { getUserIdFromToken } from "../utils/auth";
import socket from "../socket/socket";
import { FiUserPlus } from "react-icons/fi";
import { HiUserGroup } from "react-icons/hi";

function ChatList({ onSelectConversation, activeConversationId }) {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [unread, setUnread] = useState({});

  const currentUserId = getUserIdFromToken();

  const fetchConversations = async () => {
    try {
      const res = await conversationApi.getByUserId();

      const sorted = (res.data.result || []).sort(
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

  useEffect(() => {
    if (!activeConversationId) return;

    setUnread((prev) => ({
      ...prev,
      [activeConversationId]: 0,
    }));
  }, [activeConversationId]);

  useEffect(() => {
    const handleReceive = async (data) => {
      const res = await conversationApi.getByUserId();

      const sorted = (res.data.result || []).sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt),
      );

      setConversations(sorted);

      const targetConv = sorted.find(
        (conv) => conv._id === data.conversationId,
      );

      if (!targetConv) return;

      const isActive = targetConv._id === activeConversationId;

      if (isActive) {
        setUnread((prev) => ({
          ...prev,
          [targetConv._id]: 0,
        }));
        return;
      }

      setUnread((prev) => ({
        ...prev,
        [targetConv._id]: (prev[targetConv._id] || 0) + 1,
      }));
    };

    socket.on("receive_message", handleReceive);
    return () => socket.off("receive_message", handleReceive);
  }, [activeConversationId]);

  const filtered = useMemo(() => {
    return (conversations || []).filter((c) => {
      const otherUser = c.members?.find(
        (m) => m.userId?._id !== currentUserId,
      );

      const name = otherUser?.userId?.fullName || "Unknown";
      return name.toLowerCase().includes(search.toLowerCase());
    });
  }, [conversations, search]);

  const recent = filtered.filter((c) => unread[c._id] > 0);
  const others = filtered.filter((c) => !unread[c._id]);

  const renderAvatar = (user) => {
    if (user?.avatarUrl) {
      return (
        <Image
          src={user.avatarUrl}
          roundedCircle
          width={46}
          height={46}
          style={{
            objectFit: "cover",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        />
      );
    }

    return (
      <div
        className="d-flex align-items-center justify-content-center rounded-circle text-white"
        style={{
          width: 46,
          height: 46,
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          fontWeight: "bold",
        }}
      >
        {user?.fullName?.charAt(0) || "?"}
      </div>
    );
  };

  const renderItem = (conv) => {
    const otherUser = conv.members?.find(
      (m) => m.userId?._id !== currentUserId,
    );

    const user = otherUser?.userId;
    const isActive = activeConversationId === conv._id;

    return (
      <div
        key={conv._id}
        onClick={() => {
          setUnread((prev) => ({
            ...prev,
            [conv._id]: 0,
          }));
          onSelectConversation?.(conv);
        }}
        style={{
          cursor: "pointer",
          padding: "10px",
          borderRadius: 16,
          background: isActive ? "#eef2ff" : "#fff",
          boxShadow: isActive
            ? "0 6px 16px rgba(99,102,241,0.25)"
            : "0 2px 8px rgba(0,0,0,0.06)",
          transition: "all 0.2s ease",
          transform: "scale(1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.02)";
          e.currentTarget.style.boxShadow =
            "0 6px 16px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = isActive
            ? "0 6px 16px rgba(99,102,241,0.25)"
            : "0 2px 8px rgba(0,0,0,0.06)";
        }}
      >
        <Row className="align-items-center">
          <Col xs="auto">{renderAvatar(user)}</Col>

          <Col>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {user?.fullName || "Unknown"}
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#64748b",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {conv.lastMessageId?.content || "Chưa có tin nhắn"}
            </div>
          </Col>

          <Col xs="auto">
            {unread[conv._id] > 0 && (
              <Badge
                pill
                bg="danger"
                style={{
                  fontSize: 11,
                  padding: "5px 7px",
                }}
              >
                {unread[conv._id] > 9 ? "9+" : unread[conv._id]}
              </Badge>
            )}
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div
      className="p-3"
      style={{
        background: "#f1f5f9",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* SEARCH */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Form.Control
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            borderRadius: 20,
            height: 42,
            border: "1px solid #e2e8f0",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
          }}
          onFocus={(e) =>
            (e.target.style.boxShadow =
              "0 0 0 2px rgba(99,102,241,0.3)")
          }
          onBlur={(e) =>
            (e.target.style.boxShadow =
              "inset 0 1px 2px rgba(0,0,0,0.05)")
          }
        />

        <Button
          onClick={() => setOpenModal(true)}
          style={{
            borderRadius: "50%",
            width: 42,
            height: 42,
            background: "#6366f1",
            border: "none",
            transition: "0.2s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <FiUserPlus />
        </Button>

        <Button
          style={{
            borderRadius: "50%",
            width: 42,
            height: 42,
            background: "#10b981",
            border: "none",
            transition: "0.2s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <HiUserGroup />
        </Button>
      </div>

      {/* RECENT */}
      {recent.length > 0 && (
        <>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            Hoạt động gần đây
          </div>
          <div className="d-flex flex-column gap-2 mb-3">
            {recent.map(renderItem)}
          </div>
        </>
      )}

      {/* ALL */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#64748b",
          marginBottom: 8,
        }}
      >
        Tất cả cuộc trò chuyện
      </div>

      <div className="d-flex flex-column gap-2">
        {others.map(renderItem)}
      </div>

      {/* MODAL */}
      {openModal && <AddFriendModal onClose={() => setOpenModal(false)} />}
    </div>
  );
}

export default ChatList;