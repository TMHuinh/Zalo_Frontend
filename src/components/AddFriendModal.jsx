import { useState } from "react";
import friendshipApi from "../api/friendshipApi";
import userApi from "../api/userApi";
import { toast } from "react-toastify";
import socket from "../socket/socket"; // 🔥 THÊM

function AddFriendModal({ onClose, currentUserId }) {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // ======================
  // SEARCH USER
  // ======================
  const handleSearch = async () => {
    if (!phone.trim()) return toast.warning("Nhập số điện thoại");

    try {
      setSearching(true);
      setResult(null);

      const res = await userApi.searchByPhone(phone);

      setResult(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không tìm thấy user");
      setResult(null);
    } finally {
      setSearching(false);
    }
  };

  // ======================
  // ADD FRIEND
  // ======================
  const handleAddFriend = async (id) => {
    try {
      setLoading(true);

      const res = await friendshipApi.sendRequest(id);

      toast.success(res.data.message || "Đã gửi lời mời");

      // 🔥 REALTIME EMIT
      socket.emit("send_friend_request", {
        senderId: currentUserId,
        receiverId: id,
      });

      // update UI
      setResult((prev) => ({
        ...prev,
        relationship: "pending",
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Gửi lời mời thất bại");
    } finally {
      setLoading(false);
    }
  };

  const foundUser = result?.user;
  const relationship = result?.relationship;

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
      >
        {/* MODAL */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 450,
            borderRadius: 20,
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 25px 70px rgba(0,0,0,0.25)",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: 16,
              background: "linear-gradient(135deg,#0068ff,#00c6ff)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            👥 Tìm kiếm bạn bè
          </div>

          {/* BODY */}
          <div style={{ padding: 16 }}>
            {/* INPUT */}
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #ddd",
                outline: "none",
                fontSize: 14,
              }}
            />

            <button
              onClick={handleSearch}
              style={{
                width: "100%",
                marginTop: 10,
                padding: 12,
                borderRadius: 12,
                border: "none",
                background: "#0068ff",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {searching ? "Đang tìm..." : "Tìm kiếm"}
            </button>

            {/* RESULT */}
            {foundUser && (
              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  borderRadius: 16,
                  background: "#f9fafb",
                  border: "1px solid #eee",
                }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <img
                    src={
                      foundUser.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${foundUser.fullName}`
                    }
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />

                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {foundUser.fullName}
                    </div>

                    <div style={{ fontSize: 13, color: "#666" }}>
                      {foundUser.phone}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 4,
                        color: foundUser.isOnline ? "green" : "#888",
                      }}
                    >
                      {foundUser.isOnline ? "● Online" : "● Offline"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    color: "#444",
                    lineHeight: "22px",
                  }}
                >
                  <div>
                    <b>Email:</b> {foundUser.email || "Chưa cập nhật"}
                  </div>
                  <div>
                    <b>Giới tính:</b> {foundUser.gender || "Chưa cập nhật"}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  {relationship === "self" ? (
                    <button
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 12,
                        border: "none",
                        background: "#ff9800",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "not-allowed",
                      }}
                      disabled
                    >
                      Cập nhật
                    </button>
                  ) : relationship === "accepted" ? (
                    <button
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 12,
                        border: "none",
                        background: "#3b82f6",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    >
                      💬 Nhắn tin
                    </button>
                  ) : relationship === "pending" ? (
                    <button
                      disabled
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 12,
                        border: "none",
                        background: "#f59e0b",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "not-allowed",
                      }}
                    >
                      ⏳ Đã gửi lời mời
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddFriend(foundUser._id)}
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 12,
                        border: "none",
                        background: "#22c55e",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    >
                      {loading ? "Đang gửi..." : "➕ Kết bạn"}
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                width: "100%",
                marginTop: 14,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddFriendModal;