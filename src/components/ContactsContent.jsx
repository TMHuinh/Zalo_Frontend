import { useEffect, useState } from "react";
import { Image, Row, Col, Button, Card } from "react-bootstrap";
import friendshipApi from "../api/friendshipApi";
import conversationApi from "../api/conversationApi";
import socket from "../socket/socket";
import useNotificationStore from "../store/notificationStore";

function ContactsContent({ view, search = "", onSelectConversation }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const { clearNewRequest } = useNotificationStore();

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (view === "friends") {
          const res = await friendshipApi.getFriends();
          const data = res.data?.data;

          const flat = Array.isArray(data)
            ? data
            : Object.values(data || {}).flat();

          setFriends(flat);
        }

        if (view === "requests") {
          const res = await friendshipApi.getPending();
          setRequests(res.data?.data || []);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, [view]);

  useEffect(() => {
    socket.on("notification:new", (noti) => {
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
    });

    return () => socket.off("notification:new");
  }, []);

  useEffect(() => {
    socket.on("user_online", (userId) => {
      setFriends((prev) =>
        prev.map((f) => (f._id === userId ? { ...f, isOnline: true } : f)),
      );
    });

    socket.on("user_offline", (userId) => {
      setFriends((prev) =>
        prev.map((f) => (f._id === userId ? { ...f, isOnline: false } : f)),
      );
    });

    return () => {
      socket.off("user_online");
      socket.off("user_offline");
    };
  }, []);

  useEffect(() => {
    if (view === "requests") {
      clearNewRequest();
    }
  }, [view]);

  useEffect(() => {
    socket.on("new_conversation", () => {
      friendshipApi.getFriends().then((res) => {
        const data = res.data?.data;

        const flat = Array.isArray(data)
          ? data
          : Object.values(data || {}).flat();

        setFriends(flat);
      });
    });

    return () => socket.off("new_conversation");
  }, []);

  const handleMessage = async (friendId) => {
    try {
      const res = await conversationApi.getByUserId();
      const conversations = res.data.result || res.data.data || [];

      const found = conversations.find((c) =>
        c.members?.some(
          (m) => m.userId?._id === friendId || m.userId === friendId,
        ),
      );

      if (found) onSelectConversation?.(found);
    } catch (err) {
      console.log(err);
    }
  };

  const keyword = search.toLowerCase();

  const filteredFriends = friends.filter((f) =>
    f.fullName?.toLowerCase().includes(keyword),
  );

  const filteredRequests = requests.filter((r) => {
    const user = r.requesterId || { fullName: r.requesterName };
    return user.fullName.toLowerCase().includes(keyword);
  });

  const renderAvatar = (user) => (
    <div style={{ position: "relative" }}>
      {user?.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          roundedCircle
          width={50}
          height={50}
          style={{ objectFit: "cover" }}
        />
      ) : (
        <div
          className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle"
          style={{ width: 50, height: 50 }}
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

  const handleAccept = async (id) => {
    await friendshipApi.acceptRequest(id);
    setRequests((prev) => prev.filter((r) => r._id !== id));
  };

  const handleReject = async (id) => {
    await friendshipApi.rejectRequest(id);
    setRequests((prev) => prev.filter((r) => r._id !== id));
  };

  if (view === "friends") {
    return (
      <div className="p-3">
        <h5 className="mb-3 fw-bold">Bạn bè</h5>
        {filteredFriends.map((user) => (
          <Card key={user._id} className="mb-2 border-0 shadow-sm rounded-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col xs="auto">{renderAvatar(user)}</Col>
                <Col>
                  <div className="fw-semibold">{user.fullName}</div>
                  <div
                    style={{
                      fontSize: 13,
                      color: user.isOnline ? "#22c55e" : "#6c757d",
                    }}
                  >
                    {user.isOnline ? "Đang hoạt động" : "Offline"}
                  </div>
                </Col>
                <Col xs="auto">
                  <Button size="sm" onClick={() => handleMessage(user._id)}>
                    Nhắn tin
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  }

  if (view === "requests") {
    return (
      <div className="p-3">
        <h5 className="mb-3 fw-bold">Lời mời kết bạn</h5>
        {filteredRequests.map((r) => {
          const user = r.requesterId || { fullName: r.requesterName };

          return (
            <Card key={r._id} className="mb-3">
              <Card.Body>
                <Row className="align-items-center">
                  <Col xs="auto">{renderAvatar(user)}</Col>
                  <Col>
                    <div>{user.fullName}</div>
                    <div>{formatTimeAgo(r.createdAt)}</div>
                  </Col>
                  <Col xs="auto">
                    <Button onClick={() => handleAccept(r._id)}>Đồng ý</Button>
                    <Button onClick={() => handleReject(r._id)}>Từ chối</Button>
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
