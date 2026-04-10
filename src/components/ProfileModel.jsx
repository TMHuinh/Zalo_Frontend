import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import "../css/profileModel.css";
import { toast } from "react-toastify";

function ProfileModal({
  user,
  isOpen,
  onClose,
  onChangePassword,
  onUpdateInfo,
}) {
  const fileRef = useRef();
  const [avatar, setAvatar] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cập nhật avatar khi user thay đổi
  useEffect(() => {
    if (user?.avatarUrl) setAvatar(user.avatarUrl);
    else setAvatar("");
  }, [user]);

  if (!isOpen || !user) return null;

  // Click avatar để xem full
  const handlePreviewAvatar = () => {
    if (avatar) setPreviewOpen(true);
  };

  // Click icon camera để mở action modal
  const handleCameraClick = (e) => {
    e.stopPropagation();
    setActionOpen(true);
  };

  // Chọn ảnh từ thiết bị
  const handleChooseFromDevice = () => {
    setActionOpen(false);
    fileRef.current.click();
  };

  // Xem ảnh
  const handleViewAvatar = () => {
    setActionOpen(false);
    if (avatar) setPreviewOpen(true);
  };

  // Upload avatar lên backend + lưu DB
  const handleChangeAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setAvatar(preview); // hiển thị tạm thời

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken"); // token đăng nhập
      const res = await axios.post(
        "http://localhost:5000/api/user/upload-avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // backend trả về user đã update avatarUrl
      setAvatar(res.data.result.avatarUrl);

      // Cập nhật user state ngoài modal (nếu muốn)
      if (onUpdateInfo) onUpdateInfo(res.data.result);

      // alert("Cập nhật avatar thành công");
      toast.success("Cập nhật avatar thành công");
    } catch (err) {
      console.error("Upload avatar error:", err);
      // alert("Upload avatar thất bại");
      toast.error("Upload avatar thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Profile modal */}
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>

          {/* Header background */}
          <div
            className="modal-header-bg"
            style={{ backgroundImage: "url('/images/profile-bg.jpg')" }}
          />

          {/* Avatar */}
          <div className="avatar-wrapper" onClick={handlePreviewAvatar}>
            {avatar ? (
              <img src={avatar} alt="avatar" className="modal-avatar-img" />
            ) : (
              <div className="modal-avatar">{user.fullName.charAt(0)}</div>
            )}

            {/* Camera icon */}
            <div className="camera-icon" onClick={handleCameraClick}>
              📷
            </div>
          </div>

          {/* Hidden input */}
          <input
            type="file"
            ref={fileRef}
            hidden
            accept="image/*"
            onChange={handleChangeAvatar}
          />

          {/* User info */}
          <h2 className="modal-name">{user.fullName}</h2>
          <div className="modal-info">
            <p>📱 Điện thoại: {user.phone || "Chưa cập nhật"}</p>
            <p>📧 Email: {user.email || "Chưa cập nhật"}</p>
            <p>👤 Giới tính: {user.gender || "Chưa cập nhật"}</p>
            <p>🟢 Trạng thái: {user.isOnline ? "Online" : "Offline"}</p>
          </div>

          {/* Action buttons */}
          <div className="modal-actions">
            <button className="btn-change-password" onClick={onChangePassword}>
              Đổi mật khẩu
            </button>
            <button
              className="btn-update-info"
              onClick={() => onUpdateInfo && onUpdateInfo(user)}
            >
              Cập nhật thông tin
            </button>
          </div>

          {loading && <p style={{ textAlign: "center" }}>Đang upload...</p>}
        </div>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div className="preview-overlay" onClick={() => setPreviewOpen(false)}>
          <img src={avatar} alt="preview" className="preview-image" />
        </div>
      )}

      {/* Action modal */}
      {actionOpen && (
        <div className="action-overlay" onClick={() => setActionOpen(false)}>
          <div className="action-modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleViewAvatar}>👁 Xem ảnh</button>
            <button onClick={handleChooseFromDevice}>📷 Chọn ảnh</button>
            <button className="cancel-btn" onClick={() => setActionOpen(false)}>
              ❌ Hủy
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ProfileModal;
