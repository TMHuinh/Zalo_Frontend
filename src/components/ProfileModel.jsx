import React from "react";
import "../css/profileModel.css";

function ProfileModal({
  user,
  isOpen,
  onClose,
  onChangePassword,
  onUpdateInfo,
}) {
  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>

        {/* Hình nền phía trên */}
        <div
          className="modal-header-bg"
          style={{ backgroundImage: "url('/images/profile-bg.jpg')" }}
        />

        {/* Avatar nổi trên hình nền */}
        <div className="modal-avatar">{user.fullName.charAt(0)}</div>

        <h2 className="modal-name">{user.fullName}</h2>

        <div className="modal-info">
          <p>📱 Điện thoại: {user.phone}</p>
          <p>📧 Email: {user.email || "Chưa cập nhật"}</p>
          <p>👤 Giới tính: {user.gender || "Chưa cập nhật"}</p>
          <p>🟢 Trạng thái: {user.isOnline ? "Online" : "Offline"}</p>
        </div>

        <div className="modal-actions">
          <button className="btn-change-password" onClick={onChangePassword}>
            Đổi mật khẩu
          </button>
          <button className="btn-update-info" onClick={onUpdateInfo}>
            Cập nhật thông tin
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
