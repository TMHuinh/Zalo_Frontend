import { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import {
  FiSearch,
  FiUserPlus,
  FiMessageCircle,
  FiEdit2,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import friendshipApi from "../api/friendshipApi";
import userApi from "../api/userApi";
import socket from "../socket/socket";
import EditProfileModal from "./EditProfileModal";

function AddFriendModal({ onClose, currentUserId, onUserUpdated }) {
  const [phone, setPhone] = useState("");
  const [debouncedPhone, setDebouncedPhone] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPhone(phone), 400);
    return () => clearTimeout(timer);
  }, [phone]);

  useEffect(() => {
    if (!debouncedPhone.trim()) return;
    handleSearch(debouncedPhone);
  }, [debouncedPhone]);

  const handleSearch = async (value) => {
    try {
      setSearching(true);
      setResult(null);
      const res = await userApi.searchByPhone(value);
      setResult(res.data.data);
    } catch {
      setResult(null);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (id) => {
    try {
      setLoading(true);
      const res = await friendshipApi.sendRequest(id);

      toast.success(res.data.message || "Đã gửi lời mời");

      socket.emit("send_friend_request", {
        senderId: currentUserId,
        receiverId: id,
      });

      setResult((prev) => ({
        ...prev,
        relationship: "pending",
      }));
    } catch {
      toast.error("Gửi thất bại");
    } finally {
      setLoading(false);
    }
  };

  const foundUser = result?.user;
  const relationship = result?.relationship;

  return (
    <>
      <Modal
        show
        onHide={onClose}
        centered
        backdropClassName="af-backdrop"
        dialogClassName="af-modal"
      >
        {/* HEADER */}
        <div className="af-header">
          <span>Thêm bạn</span>
          <button onClick={onClose}>✕</button>
        </div>

        {/* SEARCH */}
        <div className="af-search">
          <div className="af-search-box">
            <FiSearch className="af-search-icon" />

            <input
              placeholder="Nhập số điện thoại..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            {phone && (
              <button
                className="af-clear"
                onClick={() => setPhone("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="af-body">
          {searching && (
            <div className="af-loading">Đang tìm...</div>
          )}

          {!searching && !foundUser && debouncedPhone && (
            <div className="af-empty">
              Không tìm thấy người dùng
            </div>
          )}

          {/* PROFILE CARD */}
          <AnimatePresence>
            {foundUser && !searching && (
              <motion.div
                className="af-profile"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
              >
                {/* COVER */}
                <div className="af-cover" />

                {/* AVATAR */}
                <div className="af-avatar-wrap">
                  <div className="af-avatar">
                    <img
                      src={
                        foundUser.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${foundUser.fullName}`
                      }
                    />
                  </div>

                  {foundUser.isOnline && (
                    <span className="af-online" />
                  )}
                </div>

                {/* NAME */}
                <div className="af-name">
                  {foundUser.fullName}
                </div>

                {/* STATUS */}
                <div
                  className={`af-status ${
                    foundUser.isOnline ? "online" : ""
                  }`}
                >
                  {foundUser.isOnline
                    ? "Đang hoạt động"
                    : "Offline"}
                </div>

                {/* INFO */}
                <div className="af-info-box">
                  <InfoRow label="Họ và tên" value={foundUser.fullName} />
                  <InfoRow label="Số điện thoại" value={foundUser.phone} />
                  <InfoRow label="Email" value={foundUser.email} />
                  <InfoRow label="Giới tính" value={foundUser.gender} />
                </div>

                {/* ACTION */}
                <div className="af-actions">
                  {relationship === "self" ? (
                    <button onClick={() => setEditOpen(true)}>
                      <FiEdit2 /> Chỉnh sửa
                    </button>
                  ) : relationship === "accepted" ? (
                    <button>
                      <FiMessageCircle /> Nhắn tin
                    </button>
                  ) : relationship === "pending" ? (
                    <button disabled>Đã gửi lời mời</button>
                  ) : (
                    <button
                      onClick={() =>
                        handleAddFriend(foundUser._id)
                      }
                    >
                      {loading ? (
                        "Đang gửi..."
                      ) : (
                        <>
                          <FiUserPlus /> Kết bạn
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <EditProfileModal
        user={foundUser}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={(updatedUser) => {
          setResult((prev) => ({
            ...prev,
            user: updatedUser,
          }));
          onUserUpdated?.();
        }}
      />

      {/* STYLE */}
      <style>{`
        .af-backdrop {
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(8px);
        }

        .af-modal .modal-content {
          border-radius: 20px;
          overflow: hidden;
          border: none;
        }

        /* HEADER */
        .af-header {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          font-weight: 600;
          border-bottom: 1px solid #eee;
        }

        .af-header button {
          border: none;
          background: none;
          font-size: 18px;
          cursor: pointer;
        }

        /* SEARCH */
        .af-search {
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
          background: #fafbff;
        }

        .af-search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1px solid #e6e8f0;
          border-radius: 12px;
          padding: 10px 12px;
          transition: 0.25s;
        }

        .af-search-box:focus-within {
          border-color: #0068ff;
          box-shadow: 0 0 0 3px rgba(0,104,255,0.12);
        }

        .af-search-icon {
          color: #888;
        }

        .af-search-box input {
          border: none;
          outline: none;
          flex: 1;
        }

        .af-clear {
          border: none;
          background: #eee;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          cursor: pointer;
        }

        /* BODY */
        .af-body {
          padding: 20px;
        }

        .af-loading,
        .af-empty {
          text-align: center;
          color: #888;
        }

        /* PROFILE CARD */
        .af-profile {
          background: white;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0,0,0,0.15);
          text-align: center;
        }

        .af-cover {
          height: 120px;
          background: linear-gradient(135deg,#0068ff,#00c6ff);
        }

        .af-avatar-wrap {
          position: relative;
          margin-top: -50px;
        }

        .af-avatar {
          width: 100px;
          height: 100px;
          margin: auto;
          border-radius: 50%;
          padding: 4px;
          background: white;
        }

        .af-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .af-online {
          position: absolute;
          right: calc(50% - 50px + 70px);
          bottom: 10px;
          width: 14px;
          height: 14px;
          background: #22c55e;
          border-radius: 50%;
          border: 2px solid white;
        }

        .af-name {
          margin-top: 10px;
          font-size: 18px;
          font-weight: 600;
        }

        .af-status {
          font-size: 12px;
          margin-top: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          display: inline-block;
          background: #eee;
        }

        .af-status.online {
          background: #e7f8ee;
          color: #1a7f37;
        }

        /* INFO */
        .af-info-box {
          margin: 16px;
          text-align: left;
          font-size: 14px;
        }

        .af-row {
          display: flex;
          margin-bottom: 10px;
        }

        .af-label {
          width: 120px;
          color: #666;
        }

        .af-value {
          font-weight: 600;
        }

        /* ACTION */
        .af-actions {
          padding: 16px;
        }

        .af-actions button {
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg,#0068ff,#3b82f6);
          color: white;
          font-weight: 500;
          cursor: pointer;
        }

        .af-actions button:disabled {
          background: #ccc;
        }
      `}</style>
    </>
  );
}

/* INFO ROW */
function InfoRow({ label, value }) {
  return (
    <div className="af-row">
      <div className="af-label">{label}</div>
      <div className="af-value">: {value || "Chưa cập nhật"}</div>
    </div>
  );
}

export default AddFriendModal;