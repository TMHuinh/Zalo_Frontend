import { useEffect, useState, useMemo } from "react";
import { Form, Button, Badge, Row, Col, Image } from "react-bootstrap";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import AddFriendModal from "../components/AddFriendModal";
import conversationApi from "../api/conversationApi";
import { getUserIdFromToken } from "../utils/auth";
import socket from "../socket/socket";
import { FiUserPlus } from "react-icons/fi";
import { HiUserGroup } from "react-icons/hi";
import CreateGroupModal from "./CreateGroupModal";
import toast, { Toaster } from "react-hot-toast";

function ChatList({
  onSelectConversation,
  activeConversationId,
  conversations,
}) {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  // const [conversations, setConversations] = useState([]);
  const [unread, setUnread] = useState({});
  const [openGroupModal, setOpenGroupModal] = useState(false);

  const currentUserId = getUserIdFromToken();
  // ==== xử lý load html=======
  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, "");
  };

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

  // useEffect(() => {
  //   fetchConversations();
  // }, []);

  useEffect(() => {
    if (!activeConversationId) return;

    setUnread((prev) => ({
      ...prev,
      [activeConversationId]: 0,
    }));
  }, [activeConversationId]);

  // ===== LOGIC LẮNG NGHE SOCKET: TIN NHẮN & TRẠNG THÁI ONLINE =====
  useEffect(() => {
    const handleReceive = async (data) => {
      // fetchConversations();

      const targetConv = conversations.find(
        (conv) => conv._id === data.conversationId,
      );

      if (!targetConv) return;
      const isActive = targetConv._id === activeConversationId;
      if (isActive) {
        setUnread((prev) => ({ ...prev, [targetConv._id]: 0 }));
        return;
      }

      setUnread((prev) => ({
        ...prev,
        [targetConv._id]: (prev[targetConv._id] || 0) + 1,
      }));
    };

    const handleUserOnline = (userId) => {
      setConversations((prevConvs) =>
        prevConvs.map((conv) => {
          const updatedMembers = conv.members.map((m) => {
            if (m.userId && m.userId._id === userId) {
              return { ...m, userId: { ...m.userId, isOnline: true } };
            }
            return m;
          });
          return { ...conv, members: updatedMembers };
        }),
      );
    };

    const handleUserOffline = (userId) => {
      setConversations((prevConvs) =>
        prevConvs.map((conv) => {
          const updatedMembers = conv.members.map((m) => {
            if (m.userId && m.userId._id === userId) {
              return { ...m, userId: { ...m.userId, isOnline: false } };
            }
            return m;
          });
          return { ...conv, members: updatedMembers };
        }),
      );
    };

    socket.on("receive_message", handleReceive);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
    };
  }, [activeConversationId, conversations]);

  const filtered = useMemo(() => {
    return (conversations || []).filter((c) => {
      const members = c?.members || [];
      const otherUser = members.find((m) => m?.userId?._id !== currentUserId);
      const name =
        c.type === "group" ? c.name : otherUser?.userId?.fullName || "Unknown";

      return (name || "").toLowerCase().includes((search || "").toLowerCase());
    });
  }, [conversations, search, currentUserId]);

  const recent = filtered.filter((c) => unread[c._id] > 0);
  const others = filtered.filter((c) => !unread[c._id]);

  const renderAvatar = (user) => {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        {user?.avatarUrl ? (
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
        ) : (
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
        )}

        {user?.isOnline && (
          <span
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 12,
              height: 12,
              backgroundColor: "#22c55e",
              borderRadius: "50%",
              border: "2px solid white",
            }}
          />
        )}
      </div>
    );
  };

  const renderItem = (conv) => {
    const members = conv?.members || [];
    const isGroup = members.length > 2 || conv.type === "group";
    const otherUser = members.find((m) => m?.userId?._id !== currentUserId);
    const user = otherUser?.userId;
    const isActive = activeConversationId === conv._id;

    return (
      <div
        key={conv._id}
        onClick={() => {
          setUnread((prev) => ({ ...prev, [conv._id]: 0 }));
          onSelectConversation?.(conv);
        }}
        className="mb-1"
        style={{
          cursor: "pointer",
          padding: "12px",
          borderRadius: 16,
          background: isActive ? "#eef2ff" : "#fff",
          boxShadow: isActive
            ? "0 4px 12px rgba(99,102,241,0.2)"
            : "0 2px 4px rgba(0,0,0,0.02)",
          transition: "all 0.2s ease",
        }}
      >
        <Row className="align-items-center g-0">
          <Col xs="auto" className="me-3">
            {isGroup ? (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #00c6ff, #0072ff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: "0 4px 10px rgba(0, 114, 255, 0.3)",
                }}
              >
                <HiUserGroup size={24} />
              </div>
            ) : (
              renderAvatar(user)
            )}
          </Col>

          <Col style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 15,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {isGroup
                ? conv.name || `Nhóm chat (${members.length})`
                : user?.fullName || "Unknown"}
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
              {conv.lastMessageId
                ? conv.lastMessageId.isRecalled
                  ? "Tin nhắn đã được thu hồi"
                  : conv.lastMessageId.type === "text"
                    ? stripHtml(conv.lastMessageId.content)
                    : conv.lastMessageId.type === "sticker"
                      ? "Sticker"
                      : conv.lastMessageId.type === "image"
                        ? "Ảnh"
                        : conv.lastMessageId.type === "video"
                          ? "Video"
                          : conv.lastMessageId.type === "file"
                            ? "Tệp"
                            : conv.lastMessageId.type === "mixed"
                              ? "Tin nhắn đa phương tiện"
                              : "Tin nhắn"
                : "Chưa có tin nhắn"}
            </div>
          </Col>

          <Col xs="auto" className="ms-2">
            {unread[conv._id] > 0 && (
              <Badge pill bg="danger" style={{ fontSize: 10 }}>
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
      {/* 🔥 FIX Z-INDEX Ở ĐÂY */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{ zIndex: 99999 }}
      />

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
        />

        {/* Nút Thêm bạn */}
        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip id="tooltip-add-friend">Thêm bạn</Tooltip>}
        >
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
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.9)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <FiUserPlus />
          </Button>
        </OverlayTrigger>

        {/* Nút Tạo nhóm */}
        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip id="tooltip-create-group">Tạo nhóm</Tooltip>}
        >
          <Button
            onClick={() => setOpenGroupModal(true)}
            style={{
              borderRadius: "50%",
              width: 42,
              height: 42,
              background: "#10b981",
              border: "none",
              transition: "0.2s",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.9)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <HiUserGroup />
          </Button>
        </OverlayTrigger>
      </div>

      {/* RECENT */}
      {recent.length > 0 && (
        <>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              marginBottom: 10,
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
          fontSize: 13,
          fontWeight: 600,
          color: "#64748b",
          marginBottom: 10,
        }}
      >
        Tất cả cuộc trò chuyện
      </div>

      <div className="d-flex flex-column gap-2">{others.map(renderItem)}</div>

      {/* MODAL */}
      {openModal && <AddFriendModal onClose={() => setOpenModal(false)} />}

      {openGroupModal && (
        <CreateGroupModal
          onClose={() => setOpenGroupModal(false)}
          onCreated={(newConv) => {
            setConversations((prev) => [newConv, ...prev]);
            onSelectConversation?.(newConv);
          }}
        />
      )}
    </div>
  );
}

export default ChatList;
