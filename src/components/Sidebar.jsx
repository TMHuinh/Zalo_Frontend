import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserIdFromToken } from "../utils/auth";
import userApi from "../api/userApi";
import loginApi from "../api/loginApi";
import ProfileModal from "../components/ProfileModel"; // ✅ FIX TÊN FILE
import "../css/sidebar.css";
import { FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";
import { FaCommentDots, FaAddressBook } from "react-icons/fa";

function Sidebar({ tab, setTab }) { // ✅ NHẬN PROPS
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
        setUser(res.data.result.result);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  // Mở modal profile
  const handleAvatarClick = () => {
    if (!user) {
      toast.error("Chưa đăng nhập");
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
      toast.success("Đăng xuất thành công");
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Đăng xuất thất bại");
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

      {/* NAV ICONS */}
      <div
        className={`sidebar-icon ${tab === "chat" ? "active" : ""}`}
        onClick={() => setTab("chat")}
      >
        <FaCommentDots />
      </div>

      <div
        className={`sidebar-icon ${tab === "contacts" ? "active" : ""}`}
        onClick={() => setTab("contacts")}
      >
        <FaAddressBook />
      </div>

      {/* Logout */}
      <button
        className="logout-button"
        onClick={handleLogout}
        title="Đăng xuất"
      >
        <FiLogOut size={20} />
      </button>

      {/* Profile Modal */}
      <ProfileModal
        user={user}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChangePassword={() => {
          setIsModalOpen(false);
          navigate("/change-password");
        }}
        onUpdateInfo={(updatedUser) => {
          setUser(updatedUser);
        }}
      />
    </div>
  );
}

export default Sidebar;