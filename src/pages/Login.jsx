import { useState } from "react";
import { useNavigate } from "react-router-dom";
import loginApi from "../api/loginApi";
import "../css/login.css";

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [isVerifyMode, setIsVerifyMode] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  // ✅ NEW
  const [agreePolicy, setAgreePolicy] = useState(false);

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    otp: "",
    policy: "", // ✅ NEW
  });

  const navigate = useNavigate();

  const validateEmailOnly = () => {
    const newErrors = {};
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Email không đúng định dạng";
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    setError("");

    if (!validateEmailOnly()) return;

    try {
      await loginApi.forgotPassword({ email });
      alert("Mật khẩu mới đã được gửi về email");
      setIsForgotPassword(false);
      setEmail("");
    } catch (err) {
      console.error(err);
      alert("Không thể gửi lại mật khẩu");
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setAgreePolicy(false); // ✅ NEW
    setError("");
    setErrors({
      fullName: "",
      email: "",
      password: "",
      otp: "",
      policy: "",
    });
  };

  // LOGIN
  const handleLogin = async () => {
    try {
      const res = await loginApi.login({ email, password });
      const { accessToken } = res.data.result;

      localStorage.setItem("accessToken", accessToken);
      navigate("/chat");
    } catch (err) {
      alert("Sai tài khoản hoặc mật khẩu");
      console.log(err);
    }
  };

  const validateRegisterForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Email không đúng định dạng";
    }

    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    }

    // ✅ NEW
    if (!agreePolicy) {
      newErrors.policy = "Bạn phải đồng ý với điều khoản";
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateOtpForm = () => {
    const newErrors = {};

    if (!otp.trim()) {
      newErrors.otp = "Vui lòng nhập mã OTP";
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = "OTP phải gồm 6 chữ số";
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // REGISTER -> gửi OTP
  const handleRegister = async () => {
    setError("");

    if (!validateRegisterForm()) return;

    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      await loginApi.register({
        fullName,
        email,
        password,
      });

      alert("Đăng ký thành công. Vui lòng nhập OTP đã gửi về email.");
      setIsVerifyMode(true);
    } catch (err) {
      console.error(err.message);
      alert("Đăng ký thất bại");
    }
  };

  // VERIFY OTP
  const handleVerifyOtp = async () => {
    setError("");

    if (!validateOtpForm()) return;

    try {
      await loginApi.verifyEmail({
        email,
        otp,
      });

      alert("Xác thực email thành công");
      setIsVerifyMode(false);
      setIsRegister(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("OTP không đúng hoặc đã hết hạn");
    }
  };

  // GỬI LẠI OTP
  const handleResendOtp = async () => {
    try {
      await loginApi.resendOtp({ email });
      alert("Đã gửi lại OTP về email");
    } catch (err) {
      console.error(err);
      alert("Gửi lại OTP thất bại");
    }
  };

  return (
    <div className="login-page">
      <div className="login-header">
        <h1>Chat</h1>
        <p>
          Đăng nhập tài khoản
          <br />
          để kết nối với ứng dụng Web chat
        </p>
      </div>

      <div className="login-box">
        <h3>
          {isForgotPassword
            ? "Lấy lại mật khẩu"
            : isVerifyMode
            ? "Xác thực email"
            : isRegister
            ? "Đăng ký tài khoản"
            : "Đăng nhập với mật khẩu"}
        </h3>

        {isForgotPassword ? (
          <>
            <div className="input-group">
              <input
                type="text"
                placeholder="Nhập email để lấy lại mật khẩu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <p className="error-text">{errors.email}</p>}

            <button className="login-btn" onClick={handleForgotPassword}>
              Gửi mật khẩu mới
            </button>

            <p
              className="qr-login"
              onClick={() => {
                setIsForgotPassword(false);
                setEmail("");
                setErrors({
                  fullName: "",
                  email: "",
                  password: "",
                  otp: "",
                  policy: "",
                });
              }}
              style={{ cursor: "pointer" }}
            >
              ← Quay lại đăng nhập
            </p>
          </>
        ) : isVerifyMode ? (
          <>
            <div className="input-group">
              <input type="text" value={email} disabled />
            </div>

            <div className="input-group">
              <input
                type="text"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            {errors.otp && <p className="error-text">{errors.otp}</p>}

            <button className="login-btn" onClick={handleVerifyOtp}>
              Xác thực
            </button>

            <p
              className="qr-login"
              onClick={handleResendOtp}
              style={{ cursor: "pointer" }}
            >
              Gửi lại OTP
            </p>

            <p
              className="qr-login"
              onClick={() => {
                setIsVerifyMode(false);
                setOtp("");
              }}
              style={{ cursor: "pointer" }}
            >
              ← Quay lại đăng ký
            </p>
          </>
        ) : (
          <>
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
                {errors.fullName && (
                  <p className="error-text">{errors.fullName}</p>
                )}
              </>
            )}

            <div className="input-group">
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <p className="error-text">{errors.email}</p>}

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
            {errors.password && <p className="error-text">{errors.password}</p>}

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
                {error && <p className="error-text">{error}</p>}

                {/* ✅ POLICY */}
                <div className="policy">
                  <input
                    type="checkbox"
                    checked={agreePolicy}
                    onChange={(e) => setAgreePolicy(e.target.checked)}
                  />
                  <span>
                    Tôi đồng ý với{" "}
                    <a href="/policy" target="_blank">
                      điều khoản sử dụng
                    </a>
                  </span>
                </div>
                {errors.policy && (
                  <p className="error-text">{errors.policy}</p>
                )}
              </>
            )}

            <button
              className="login-btn"
              onClick={() => (isRegister ? handleRegister() : handleLogin())}
            >
              {isRegister ? "Đăng ký" : "Đăng nhập"}
            </button>

            <p
              className="qr-login"
              onClick={() => {
                setIsRegister(!isRegister);
                resetForm();
              }}
              style={{ cursor: "pointer" }}
            >
              {isRegister
                ? "← Quay lại đăng nhập"
                : "Chưa có tài khoản? Đăng ký"}
            </p>

            {!isRegister && (
              <p
                className="forgot"
                onClick={() => {
                  setIsForgotPassword(true);
                  resetForm();
                }}
                style={{ cursor: "pointer" }}
              >
                Quên mật khẩu
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Login;