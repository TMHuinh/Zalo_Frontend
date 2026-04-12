import { useEffect, useState } from "react";
import {
    Image,
    Row,
    Col,
    Button,
    Card,
} from "react-bootstrap";
import friendshipApi from "../api/friendshipApi";
import conversationApi from "../api/conversationApi"; // 🔥 THÊM
import socket from "../socket/socket";
import useNotificationStore from "../store/notificationStore";

function ContactsContent({ view, search = "", onSelectConversation }) {
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);

    const { clearNewRequest } = useNotificationStore();

    // ================= FORMAT TIME =================
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

    // ================= FETCH =================
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (view === "friends") {
                    const res = await friendshipApi.getFriends();
                    setFriends(res.data.data || []);
                }

                if (view === "requests") {
                    const res = await friendshipApi.getPending();
                    setRequests(res.data.data || []);
                }
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
    }, [view]);

    // ================= REALTIME =================
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
                setRequests((prev) =>
                    prev.filter((r) => r._id !== data.friendshipId)
                );
            }
        });

        return () => socket.off("notification:new");
    }, []);

    // ================= ONLINE =================
    useEffect(() => {
        socket.on("user_online", (userId) => {
            setFriends((prev) =>
                prev.map((f) =>
                    f.friend._id === userId
                        ? { ...f, friend: { ...f.friend, isOnline: true } }
                        : f
                )
            );
        });

        socket.on("user_offline", (userId) => {
            setFriends((prev) =>
                prev.map((f) =>
                    f.friend._id === userId
                        ? { ...f, friend: { ...f.friend, isOnline: false } }
                        : f
                )
            );
        });

        return () => {
            socket.off("user_online");
            socket.off("user_offline");
        };
    }, []);

    // ================= CLEAR DOT =================
    useEffect(() => {
        if (view === "requests") {
            clearNewRequest();
        }
    }, [view]);

    // ================= NEW FRIEND =================
    useEffect(() => {
        socket.on("new_conversation", () => {
            friendshipApi.getFriends().then((res) => {
                setFriends(res.data.data || []);
            });
        });

        return () => socket.off("new_conversation");
    }, []);

    // ================= 🔥 MỞ CHAT =================
    const handleMessage = async (friendId) => {
        try {
            const res = await conversationApi.getByUserId();

            console.log("RAW RES:", res);
            console.log("DATA:", res.data);

            const conversations =
                res.data.result || res.data.data || [];

            console.log("CONVS:", conversations);

            const found = conversations.find((c) => {
                console.log("CHECK CONV:", c);

                return c.members?.some((m) => {
                    console.log("MEMBER:", m);

                    return (
                        m.userId?._id === friendId ||
                        m.userId === friendId
                    );
                });
            });

            console.log("FOUND:", found);

            if (found) {
                onSelectConversation?.(found);
            } else {
                console.log("❌ KHÔNG TÌM THẤY CONVERSATION");
            }
        } catch (err) {
            console.log("ERROR:", err);
        }
    };

    // ================= FILTER =================
    const keyword = search.toLowerCase();

    const filteredFriends = friends.filter((f) =>
        f.friend.fullName.toLowerCase().includes(keyword)
    );

    const filteredRequests = requests.filter((r) => {
        const user =
            r.requesterId || {
                fullName: r.requesterName,
            };

        return user.fullName.toLowerCase().includes(keyword);
    });

    // ================= AVATAR =================
    const renderAvatar = (user) => {
        return (
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
                        style={{ width: 50, height: 50, fontWeight: "bold" }}
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
    };

    // ================= ACTION =================
    const handleAccept = async (id) => {
        await friendshipApi.acceptRequest(id);
        setRequests((prev) => prev.filter((r) => r._id !== id));
    };

    const handleReject = async (id) => {
        await friendshipApi.rejectRequest(id);
        setRequests((prev) => prev.filter((r) => r._id !== id));
    };

    // ================= FRIENDS =================
    if (view === "friends") {
        return (
            <div className="p-3">
                <h5 className="mb-3 fw-bold">Bạn bè</h5>

                {filteredFriends.map((f) => {
                    const user = f.friend;

                    return (
                        <Card key={f._id} className="mb-2 border-0 shadow-sm rounded-4">
                            <Card.Body>
                                <Row className="align-items-center">
                                    <Col xs="auto">{renderAvatar(user)}</Col>

                                    <Col>
                                        <div className="fw-semibold">{user.fullName}</div>
                                        <div style={{ fontSize: 13, color: user.isOnline ? "#22c55e" : "#6c757d" }}>
                                            {user.isOnline ? "Đang hoạt động" : "Offline"}
                                        </div>
                                    </Col>

                                    <Col xs="auto">
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            className="rounded-pill px-3"
                                            onClick={() => handleMessage(user._id)} // 🔥 THÊM
                                        >
                                            Nhắn tin
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

    // ================= REQUESTS =================
    if (view === "requests") {
        return (
            <div className="p-3">
                <h5 className="mb-3 fw-bold">Lời mời kết bạn</h5>

                {filteredRequests.map((r) => {
                    const user = r.requesterId || {
                        fullName: r.requesterName,
                        avatarUrl: r.requesterAvatar,
                    };

                    return (
                        <Card key={r._id} className="mb-3 border-0 shadow-sm rounded-4">
                            <Card.Body>
                                <Row className="align-items-center">
                                    <Col xs="auto">{renderAvatar(user)}</Col>

                                    <Col>
                                        <div className="fw-semibold">{user.fullName}</div>
                                        <div className="text-muted" style={{ fontSize: 13 }}>
                                            {formatTimeAgo(r.createdAt)}
                                        </div>
                                    </Col>

                                    <Col xs="auto" className="d-flex gap-2">
                                        <Button size="sm" variant="primary" onClick={() => handleAccept(r._id)}>
                                            Đồng ý
                                        </Button>

                                        <Button size="sm" variant="outline-secondary" onClick={() => handleReject(r._id)}>
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