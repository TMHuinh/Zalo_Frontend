import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserIdFromToken } from "../utils/auth";
import userApi from "../api/userApi";
import loginApi from "../api/loginApi";
import ProfileModal from "./ProfileModel";
import "../css/sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Lấy thông tin user khi Sidebar load
  useEffect(() => {
    const fetchUser = async () => {
      const userId = getUserIdFromToken();
      if (!userId) return;
      try {
        const res = await userApi.getById(userId);
        setUser(res.data.result.result); // avatarUrl có trong user
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  // Mở modal profile
  const handleAvatarClick = () => {
    if (!user) {
      alert("Chưa đăng nhập");
      return;
    }
    setIsModalOpen(true);
  };

  // Logout
  const handleLogout = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    if (!window.confirm("Bạn có chắc muốn đăng xuất?")) return;

    try {
      await loginApi.logout(token);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      alert("Đăng xuất thành công");
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Đăng xuất thất bại, thử lại");
    }
  };

  return (
    <div className="sidebar">
      {/* Avatar */}
      <div className="avatar" onClick={handleAvatarClick}>
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.fullName}
            className="sidebar-avatar-img"
          />
        ) : (
          <div className="sidebar-avatar-fallback">
            {user ? user.fullName.charAt(0) : "U"}
          </div>
        )}
      </div>

      {/* Logout icon */}
      <button
        className="logout-button"
        onClick={handleLogout}
        title="Đăng xuất"
      >
        🔓
      </button>

      {/* Modal profile */}
      {/* <ProfileModal
        user={user}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChangePassword={() => {
          setIsModalOpen(false);
          navigate("/change-password");
        }}
        onUpdateInfo={() => alert("Chức năng cập nhật thông tin chưa triển khai")}
      /> */}
      <ProfileModal
        user={user}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChangePassword={() => {
          setIsModalOpen(false);
          navigate("/change-password");
        }}
        onUpdateInfo={(updatedUser) => {
          setUser(updatedUser); // ✅ cập nhật user state ngay
        }}
      />
    </div>
  );
}

export default Sidebar;