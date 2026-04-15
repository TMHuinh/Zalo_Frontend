import { useEffect, useState, useCallback, useMemo } from "react";
import { Image, Row, Col, Button, Card, Spinner } from "react-bootstrap";
import friendshipApi from "../api/friendshipApi";
import conversationApi from "../api/conversationApi";
import socket from "../socket/socket";
import useNotificationStore from "../store/notificationStore";

function ContactsContent({ view, search = "", onSelectConversation }) {
  const [friends, setFriends] = useState([]);
  const [groupedFriends, setGroupedFriends] = useState({});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const { clearNewRequest } = useNotificationStore();

  // ===== Empty State =====
  const EmptyState = ({ text }) => (
    <div
      className="d-flex flex-column align-items-center justify-content-center text-center"
      style={{ padding: "40px 20px", color: "#94a3b8" }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#e2e8f0,#cbd5f5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          fontSize: 28,
        }}
      >
        📭
      </div>
      <div className="fw-semibold" style={{ color: "#475569" }}>
        {text}
      </div>
    </div>
  );

  const formatTimeAgo = (date) => {
    if (!date) return "";
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true);
      const res = await friendshipApi.getFriends();
      const data = res.data?.data;

      if (!Array.isArray(data)) {
        setGroupedFriends(data || {});
        setFriends(Object.values(data || {}).flat());
      } else {
        setFriends(data);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await friendshipApi.getPending();
      setRequests(res.data?.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "friends") fetchFriends();
    if (view === "requests") fetchRequests();
  }, [view, fetchFriends, fetchRequests]);

  useEffect(() => {
    const handleNotification = (noti) => {
      const data = noti?.data || {};

      if (data.status === "pending") {
        const newRequest = {
          _id: data.friendshipId,
          createdAt: new Date(),
          requesterId: {
            fullName: data.requesterName,
            avatarUrl: data.requesterAvatar,
          },
        };
        setRequests((prev) => [newRequest, ...prev]);
      }

      if (data.status === "accepted" || data.status === "rejected") {
        setRequests((prev) => prev.filter((r) => r._id !== data.friendshipId));
      }
    };

    socket.on("notification:new", handleNotification);
    return () => socket.off("notification:new", handleNotification);
  }, []);

  useEffect(() => {
    const online = (userId) => {
      setFriends((prev) =>
        prev.map((f) => (f._id === userId ? { ...f, isOnline: true } : f)),
      );
    };

    const offline = (userId) => {
      setFriends((prev) =>
        prev.map((f) => (f._id === userId ? { ...f, isOnline: false } : f)),
      );
    };

    socket.on("user_online", online);
    socket.on("user_offline", offline);

    return () => {
      socket.off("user_online", online);
      socket.off("user_offline", offline);
    };
  }, []);

  useEffect(() => {
    if (view === "requests") clearNewRequest();
  }, [view]);

  useEffect(() => {
    socket.on("new_conversation", fetchFriends);
    return () => socket.off("new_conversation", fetchFriends);
  }, [fetchFriends]);

  // ===== FIX LỖI NHẢY VÀO GROUP =====
  const handleMessage = async (friendId) => {
    try {
      const res = await conversationApi.getByUserId();
      const conversations = res.data.result || res.data.data || [];

      const found = conversations.find((c) => {
        // 1. Kiểm tra xem có phải là nhóm không. Nếu là nhóm -> Bỏ qua
        const isGroup = c.type === "group" || c.members?.length > 2;
        if (isGroup) return false;

        // 2. Nếu là chat 1-1, kiểm tra xem có chứa friendId này không
        return c.members?.some(
          (m) => m.userId?._id === friendId || m.userId === friendId,
        );
      });

      if (found) {
        onSelectConversation?.(found);
      } else {
        // Tuỳ chọn: Nếu không tìm thấy cuộc trò chuyện 1-1, bạn có thể gọi API tạo cuộc trò chuyện mới tại đây
        console.log("Chưa có cuộc trò chuyện 1-1 với user này.");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleAccept = async (id) => {
    await friendshipApi.acceptRequest(id);
    setRequests((prev) => prev.filter((r) => r._id !== id));
    fetchFriends();
  };

  const handleReject = async (id) => {
    await friendshipApi.rejectRequest(id);
    setRequests((prev) => prev.filter((r) => r._id !== id));
  };

  const keyword = (search || "").toLowerCase();

  const filteredGrouped = useMemo(() => {
    const result = {};
    Object.keys(groupedFriends).forEach((letter) => {
      const filtered = groupedFriends[letter].filter((f) =>
        f.fullName?.toLowerCase().includes(keyword),
      );
      if (filtered.length) result[letter] = filtered;
    });
    return result;
  }, [groupedFriends, keyword]);

  const letters = Object.keys(filteredGrouped);

  const renderAvatar = (user) => (
    <div style={{ position: "relative" }}>
      {user?.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          roundedCircle
          width={48}
          height={48}
          style={{
            objectFit: "cover",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        />
      ) : (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            color: "white",
            background: "linear-gradient(135deg,#6366f1,#3b82f6)",
          }}
        >
          {user?.fullName?.charAt(0) || "U"}
        </div>
      )}

      {user?.isOnline && (
        <span
          style={{
            position: "absolute",
            bottom: 2,
            right: 2,
            width: 10,
            height: 10,
            backgroundColor: "#22c55e",
            borderRadius: "50%",
            border: "2px solid white",
          }}
        />
      )}
    </div>
  );

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: 200 }}
      >
        <Spinner animation="border" />
      </div>
    );
  }

  // ===== FRIENDS =====
  if (view === "friends") {
    return (
      <div className="p-3" style={{ background: "#f8fafc" }}>
        <h5 className="mb-3 fw-bold">Bạn bè</h5>

        {letters.length === 0 && <EmptyState text="Danh sách bạn bè trống" />}

        {letters.map((letter) => (
          <div key={letter}>
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: "#f8fafc",
                padding: "6px 4px",
                fontSize: 13,
                fontWeight: 600,
                color: "#475569",
              }}
            >
              {letter}
            </div>

            {filteredGrouped[letter].map((user) => (
              <Card
                key={user._id}
                className="mb-2 border-0"
                style={{
                  borderRadius: 16,
                  background: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <Card.Body>
                  <Row className="align-items-center">
                    <Col xs="auto">{renderAvatar(user)}</Col>
                    <Col>
                      <div className="fw-semibold">{user.fullName}</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: user.isOnline ? "#22c55e" : "#94a3b8",
                        }}
                      >
                        {user.isOnline ? "Đang hoạt động" : "Offline"}
                      </div>
                    </Col>
                    <Col xs="auto">
                      <Button
                        size="sm"
                        style={{
                          borderRadius: 999,
                          background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                          border: "none",
                        }}
                        onClick={() => handleMessage(user._id)}
                      >
                        Nhắn tin
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ===== REQUESTS =====
  if (view === "requests") {
    return (
      <div className="p-3" style={{ background: "#f8fafc" }}>
        <h5 className="mb-3 fw-bold">Lời mời kết bạn</h5>

        {requests.length === 0 && <EmptyState text="Chưa có lời mời kết bạn" />}

        {requests.map((r) => {
          const user = r.requesterId || {
            fullName: r.requesterName,
            avatarUrl: r.requesterAvatar,
          };

          return (
            <Card
              key={r._id}
              className="mb-3 border-0"
              style={{
                borderRadius: 16,
                background: "white",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              <Card.Body>
                <Row className="align-items-center">
                  <Col xs="auto">{renderAvatar(user)}</Col>
                  <Col>
                    <div className="fw-semibold">{user.fullName}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {formatTimeAgo(r.createdAt)}
                    </div>
                  </Col>
                  <Col xs="auto" className="d-flex gap-2">
                    <Button
                      size="sm"
                      style={{
                        borderRadius: 999,
                        background: "#22c55e",
                        border: "none",
                      }}
                      onClick={() => handleAccept(r._id)}
                    >
                      Đồng ý
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      style={{ borderRadius: 999 }}
                      onClick={() => handleReject(r._id)}
                    >
                      Từ chối
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          );
        })}
      </div>
    );
  }

  return null;
}

export default ContactsContent;
