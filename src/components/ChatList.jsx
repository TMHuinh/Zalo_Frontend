import { useEffect, useState } from "react";
import {
  Form,
  InputGroup,
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
    const handleReceive = async (msg) => {
      try {
        const res = await conversationApi.getByUserId();

        const sorted = (res.data.result || []).sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt) -
            new Date(a.updatedAt || a.createdAt),
        );

        setConversations(sorted);

        const targetConv = sorted.find((conv) =>
          conv.members?.some((m) => m.userId?._id === msg.userId),
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
      } catch (err) {
        console.log("Socket handler error:", err);
      }
    };

    socket.on("receive_message", handleReceive);
    return () => socket.off("receive_message", handleReceive);
  }, [activeConversationId]);

  const filtered = (conversations || []).filter((c) => {
    const otherUser = c.members?.find((m) => m.userId?._id !== currentUserId);

    const name = otherUser?.userId?.fullName || "Unknown";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const renderAvatar = (user) => {
    if (user?.avatarUrl) {
      return (
        <Image
          src={user.avatarUrl}
          roundedCircle
          width={48}
          height={48}
          style={{ objectFit: "cover" }}
        />
      );
    }

    return (
      <div
        className="d-flex align-items-center justify-content-center rounded-circle text-white"
        style={{
          width: 48,
          height: 48,
          background: "linear-gradient(135deg, #6a11cb, #2575fc)",
          fontWeight: "bold",
        }}
      >
        {user?.fullName?.charAt(0) || "?"}
      </div>
    );
  };

  return (
    <div
      className="p-2"
      style={{
        background: "#f5f7fb",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* SEARCH */}
      <InputGroup className="mb-3">
        <Form.Control
          placeholder="🔍 Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            borderRadius: "12px 0 0 12px",
          }}
        />
        <button
          className="add-friend-btn"
          title="Thêm bạn"
          onClick={() => setOpenModal(true)}
        >
          <FiUserPlus size={14} />
        </button>
      </InputGroup>

      {/* LIST */}
      <div className="d-flex flex-column gap-2">
        {filtered.map((conv) => {
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
                borderRadius: 14,
                background: isActive ? "#e7f1ff" : "#fff",
                boxShadow: isActive
                  ? "0 4px 12px rgba(0,0,0,0.08)"
                  : "0 2px 6px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "#f1f3f5";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "#fff";
              }}
            >
              <Row className="align-items-center">
                <Col xs="auto">{renderAvatar(user)}</Col>

                <Col>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                    }}
                  >
                    {user?.fullName || "Unknown"}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#6c757d",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 180,
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
                        fontSize: 12,
                        padding: "6px 8px",
                      }}
                    >
                      {unread[conv._id] > 9 ? "9+" : unread[conv._id]}
                    </Badge>
                  )}
                </Col>
              </Row>
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
