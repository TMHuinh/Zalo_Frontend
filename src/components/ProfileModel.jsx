import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAvatar(user?.avatarUrl || "");
  }, [user]);

  if (!isOpen || !user) return null;

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatar(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");

      const res = await axios.post(
        "http://localhost:5000/api/user/upload-avatar",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newAvatar = res.data.result.avatarUrl;

      setAvatar(newAvatar);

      onUpdateInfo?.({
        ...user,
        avatarUrl: newAvatar,
      });

      toast.success("Cập nhật avatar thành công");
    } catch (err) {
      toast.error("Upload thất bại");
    } finally {
      setLoading(false);
    }
  };

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
        {/* CARD */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 380,
            borderRadius: 22,
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 25px 70px rgba(0,0,0,0.25)",
            animation: "pop 0.25s ease",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              height: 120,
              background: "linear-gradient(135deg,#0068ff,#00c6ff)",
            }}
          />

          {/* AVATAR */}
          <div style={{ textAlign: "center", marginTop: -50 }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <div
                style={{
                  width: 105,
                  height: 105,
                  borderRadius: "50%",
                  padding: 3,
                  background: "#fff",
                }}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    onClick={() => setPreviewOpen(true)}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: "#0068ff",
                      color: "#fff",
                      fontSize: 38,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {user.fullName?.charAt(0)}
                  </div>
                )}
              </div>

              {/* CAMERA */}
              <div
                onClick={() => fileRef.current.click()}
                style={{
                  position: "absolute",
                  bottom: 5,
                  right: 5,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#fff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
                  cursor: "pointer",
                }}
              >
                📷
              </div>
            </div>
          </div>

          <input
            type="file"
            hidden
            ref={fileRef}
            accept="image/*"
            onChange={uploadAvatar}
          />

          {/* NAME + STATUS */}
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <h4 style={{ margin: 0 }}>{user.fullName}</h4>

            <span
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 20,
                background: user.isOnline ? "#e7f8ee" : "#eee",
                color: user.isOnline ? "#1a7f37" : "#777",
                display: "inline-block",
                marginTop: 6,
              }}
            >
              {user.isOnline ? "Đang hoạt động" : "Offline"}
            </span>
          </div>

          {/* INFO */}
          <div style={{ padding: "15px 20px", fontSize: 14 }}>
            <Row label="Số điện thoại" value={user.phone} />
            <Row label="Email" value={user.email} />
            <Row label="Giới tính" value={user.gender} />
          </div>

          {/* BUTTONS */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: 15,
            }}
          >
            <button
              onClick={onChangePassword}
              style={{
                flex: 1,
                border: "1px solid #0068ff",
                color: "#0068ff",
                borderRadius: 10,
                padding: 8,
                background: "#fff",
              }}
            >
              Đổi mật khẩu
            </button>

            <button
              onClick={() => onUpdateInfo?.(user)}
              style={{
                flex: 1,
                background: "linear-gradient(135deg,#0068ff,#00c6ff)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: 8,
              }}
            >
              Cập nhật
            </button>
          </div>

          {loading && (
            <div style={{ textAlign: "center", paddingBottom: 10 }}>
              <div className="spinner-border text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* PREVIEW */}
      {previewOpen && (
        <div
          onClick={() => setPreviewOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
          }}
        >
          <img
            src={avatar}
            style={{
              maxWidth: "90%",
              borderRadius: 12,
            }}
          />
        </div>
      )}

      {/* ANIMATION */}
      <style>
        {`
          @keyframes pop {
            from { transform: scale(0.9); opacity: 0 }
            to { transform: scale(1); opacity: 1 }
          }
        `}
      </style>
    </>
  );
}

/* ================= ROW COMPONENT (ZALO STYLE ALIGN) ================= */
function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        marginBottom: 10,
        alignItems: "center",
      }}
    >
      <div style={{ width: 120, color: "#666" }}>{label}</div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ marginRight: 6 }}>:</span>
        <span style={{ fontWeight: 600, color: "#222" }}>
          {value || "Chưa cập nhật"}
        </span>
      </div>
    </div>
  );
}

export default ProfileModal;