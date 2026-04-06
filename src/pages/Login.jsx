import { useState } from "react";
import { useNavigate } from "react-router-dom";
import loginApi from "../api/loginApi";
import "../css/login.css";

function Login() {
  const [isRegister, setIsRegister] = useState(false);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({
    fullName: "",
    phone: "",
    password: "",
  });

  const navigate = useNavigate();

  // 🔐 LOGIN
  const handleLogin = async () => {
    try {
      const res = await loginApi.login({ phone, password });

      const { user, accessToken } = res.data.result;

      localStorage.setItem("accessToken", accessToken);

      navigate("/chat");

      // console.log(phone, password);
    } catch (err) {
      alert("Sai tài khoản hoặc mật khẩu");
      console.log(err);
    }
  };

  const validateForm = () => {
    let newErrors = {};

    // fullname
    if (!fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
    }

    // phone (10 số)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      newErrors.phone = "Số điện thoại phải đủ 10 số";
    }

    // password (optional thêm)
    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // 🆕 REGISTER
  const handleRegister = async () => {
    // ❌ nếu validate fail
    if (!validateForm()) return;

    // ❌ check confirm password
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      const res = await loginApi.register({
        fullName,
        phone,
        password,
      });

      alert("Đăng ký thành công");

      setIsRegister(false);

      // reset
      setFullName("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (err) {
      console.error(err);
      alert("Đăng ký thất bại");
    }
  };

  return (
    <div className="login-page">
      <div className="login-header">
        <h1>Zalo</h1>
        <p>
          Đăng nhập tài khoản
          <br />
          để kết nối với ứng dụng Web chat
        </p>
      </div>

      <div className="login-box">
        <h3>{isRegister ? "Đăng ký tài khoản" : "Đăng nhập với mật khẩu"}</h3>

        {/* FULLNAME (chỉ hiện khi đăng ký) */}
        {isRegister && (
          <>
            <div className="input-group">
              <input
                type="text"
                placeholder="Họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            {errors.fullName && <p className="error-text">{errors.fullName}</p>}
          </>
        )}

        {/* PHONE */}
        <div className="input-group">
          <input
            type="text"
            placeholder="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        {errors.phone && <p className="error-text">{errors.phone}</p>}

        {/* PASSWORD */}
        <div className="input-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="eye" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </span>
        </div>

        {/* CONFIRM PASSWORD (chỉ hiện khi đăng ký) */}
        {isRegister && (
          <>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* ERROR */}
            {error && <p className="error-text">{error}</p>}
          </>
        )}

        {/* BUTTON */}
        <button
          className="login-btn"
          onClick={() => (isRegister ? handleRegister() : handleLogin())}
        >
          {isRegister ? "Đăng ký" : "Đăng nhập"}
        </button>

        {/* SWITCH LOGIN <-> REGISTER */}
        <p
          className="qr-login"
          onClick={() => setIsRegister(!isRegister)}
          style={{ cursor: "pointer" }}
        >
          {isRegister ? "← Quay lại đăng nhập" : "Chưa có tài khoản? Đăng ký"}
        </p>

        {!isRegister && <p className="forgot">Quên mật khẩu</p>}

        {/* <div className="footer-box">
          <div className="footer-left">
            <p>
              <b>Nâng cao hiệu quả công việc với Zalo PC</b>
            </p>
            <span>
              Gửi file lớn lên đến 1GB, chụp màn hình, gọi video và nhiều tiện
              ích hơn nữa
            </span>
          </div>
          <button className="download-btn">Tải ngay</button>
        </div> */}
      </div>
    </div>
  );
}

export default Login;
