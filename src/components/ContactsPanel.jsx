import { useEffect, useState } from "react";
import friendshipApi from "../api/friendshipApi";
import AddFriendModal from "../components/AddFriendModal";
import { toast } from "react-toastify";
import "../css/contactsPanel.css";

function ContactsPanel() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [friendsRes, pendingRes] = await Promise.all([
          friendshipApi.getFriends(),
          friendshipApi.getPending(),
        ]);

        const validFriends = (friendsRes.data.data || []).filter(
          (f) => f.friend
        );

        setFriends(validFriends);
        setRequests(pendingRes.data.data || []);
      } catch (err) {
        toast.error("Lỗi tải dữ liệu");
      }
    };

    fetchData();
  }, []);

  const handleAccept = async (id) => {
    try {
      await friendshipApi.acceptRequest(id);

      const accepted = requests.find((r) => r._id === id);

      setRequests((prev) => prev.filter((r) => r._id !== id));
      setFriends((prev) => [
        ...prev,
        {
          _id: accepted._id,
          friend: accepted.requesterId,
        },
      ]);

      toast.success("Đã chấp nhận");
    } catch {
      toast.error("Lỗi");
    }
  };

  const renderAvatar = (user) => {
    if (user?.avatarUrl) {
      return (
        <img
          src={
            user.avatarUrl.startsWith("http")
              ? user.avatarUrl
              : `http://localhost:5000${user.avatarUrl}`
          }
          alt=""
        />
      );
    }
    return user?.fullName?.charAt(0) || "U";
  };

  // 🔥 FILTER GIỐNG CHATLIST
  const filteredFriends = friends.filter((f) =>
    f.friend.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="chat-list">
      {/* SEARCH + BUTTON */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Tìm bạn bè"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={() => setOpenModal(true)}>
          + Bạn
        </button>
      </div>

      {/* REQUESTS (HIỆN TRÊN) */}
      {requests.length > 0 && (
        <div className="request-section">
          <p className="section-title">Lời mời kết bạn</p>

          {requests.map((r) => (
            <div key={r._id} className="chat-item">
              <div className="avatar-small">
                {renderAvatar(r.requesterId)}
              </div>

              <div className="info">
                <p className="name">
                  {r.requesterId?.fullName || "Unknown"}
                </p>

                <button
                  className="accept-btn"
                  onClick={() => handleAccept(r._id)}
                >
                  Chấp nhận
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FRIEND LIST */}
      <div className="list">
        {filteredFriends.length === 0 ? (
          <p className="empty">Không có bạn</p>
        ) : (
          filteredFriends.map((f) => (
            <div key={f._id} className="chat-item">
              <div className="avatar-small">
                {renderAvatar(f.friend)}
              </div>

              <div className="info">
                <p className="name">{f.friend.fullName}</p>
                <span className="last-msg">
                  {f.friend.isOnline ? "Đang hoạt động" : "Offline"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {openModal && (
        <AddFriendModal onClose={() => setOpenModal(false)} />
      )}
    </div>
  );
}

export default ContactsPanel;