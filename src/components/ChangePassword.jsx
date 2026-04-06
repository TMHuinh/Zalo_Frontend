import { useState } from "react";
import userApi from "../api/userApi";
import { useNavigate } from "react-router-dom";
import "../css/changePassword.css";

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  // state show/hide
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const current = currentPassword.trim();
    const newPass = newPassword.trim();
    const confirm = confirmPassword.trim();

    if (!current || !newPass || !confirm) {
      setMessage("Vui lòng điền đầy đủ các trường");
      return;
    }

    if (newPass !== confirm) {
      setMessage("Mật khẩu mới và xác nhận không trùng khớp");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await userApi.changePassword(
        {
          oldPassword: current,
          newPassword: newPass,
          confirmPassword: confirm,
        },
        token,
      );
      setMessage(res.data.message || "Đổi mật khẩu thành công");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        const userId = localStorage.getItem("userId");
        navigate(`/profile/${userId}`);
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Có lỗi xảy ra, thử lại sau");
    }
  };

  return (
    <div className="change-password-container">
      <form className="change-password-form" onSubmit={handleSubmit}>
        <h2>Đổi Mật Khẩu</h2>

        {/* Mật khẩu hiện tại */}
        <div className="input-group">
          <input
            type={showCurrent ? "text" : "password"}
            placeholder="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <span className="eye" onClick={() => setShowCurrent(!showCurrent)}>
            {showCurrent ? "👁️" : "👁️‍🗨️"}
          </span>
        </div>

        {/* Mật khẩu mới */}
        <div className="input-group">
          <input
            type={showNew ? "text" : "password"}
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <span className="eye" onClick={() => setShowNew(!showNew)}>
            {showNew ? "👁️" : "👁️‍🗨️"}
          </span>
        </div>

        {/* Xác nhận mật khẩu */}
        <div className="input-group">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <span className="eye" onClick={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? "👁️" : "👁️‍🗨️"}
          </span>
        </div>

        <button type="submit">Đổi mật khẩu</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}

export default ChangePassword;
