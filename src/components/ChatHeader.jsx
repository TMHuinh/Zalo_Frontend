import { HiUserGroup } from "react-icons/hi";

function ChatHeader({ isGroup, conversation, chatPartner }) {
  return (
    <div className="chat-header-modern">
      <div className="header-content">
        <div className="avatar-wrapper">
          {isGroup ? (
            conversation?.avatarUrl ? (
              <img
                src={conversation.avatarUrl}
                alt="group-avt"
                className="main-avatar"
                style={{
                  width: 44,
                  height: 44,
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #00c6ff, #0072ff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: "0 4px 10px rgba(0, 114, 255, 0.3)",
                }}
              >
                <HiUserGroup size={24} />
              </div>
            )
          ) : chatPartner?.avatarUrl ? (
            <img
              src={chatPartner.avatarUrl}
              alt=""
              className="main-avatar"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              className="text-avatar"
              style={{
                background: "linear-gradient(135deg,#6366f1,#3b82f6)",
              }}
            >
              {chatPartner?.fullName?.charAt(0) || "U"}
            </div>
          )}

          {!isGroup && chatPartner?.isOnline && (
            <div
              className="status-indicator online"
              style={{ display: "block" }}
            ></div>
          )}
        </div>

        <div className="user-details">
          <h3 className="user-name">
            {isGroup
              ? conversation?.name || "Nhóm chat"
              : chatPartner?.fullName}
          </h3>
          <span
            className={`user-status-text ${chatPartner?.isOnline ? "online" : "offline"}`}
          >
            {isGroup
              ? `${conversation?.members?.length || 0} thành viên`
              : chatPartner?.isOnline
                ? "Đang hoạt động"
                : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ChatHeader;
