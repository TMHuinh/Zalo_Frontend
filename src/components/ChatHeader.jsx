import { useEffect, useRef, useState } from "react";
import { FiCpu } from "react-icons/fi";
import {
  HiDocumentText,
  HiPhotograph,
  HiSearch,
  HiUserGroup,
} from "react-icons/hi";

function ChatHeader({
  isGroup,
  isBot,
  conversation,
  chatPartner,
  onOpenSearch,
  onOpenSummary,
  onOpenMedia,
  botTopic,
  setBotTopic,
  botTopicOptions = [],
}) {
  const [showTopicPopup, setShowTopicPopup] = useState(false);
  const topicPopupRef = useRef(null);

  useEffect(() => {
    if (!showTopicPopup) return;

    const handleClickOutside = (event) => {
      if (!topicPopupRef.current?.contains(event.target)) {
        setShowTopicPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTopicPopup]);

  const title = isGroup
    ? conversation?.name || "Nhom chat"
    : isBot
      ? conversation?.name || "AI Assistant"
      : chatPartner?.fullName;

  const status = isGroup
    ? `${conversation?.members?.length || 0} thanh vien`
    : isBot
      ? "AI"
      : chatPartner?.isOnline
        ? "Dang hoat dong"
        : "Offline";

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
              {isBot ? "AI" : chatPartner?.fullName?.charAt(0) || "U"}
            </div>
          )}

          {!isGroup && chatPartner?.isOnline && (
            <div
              className="status-indicator online"
              style={{ display: "block" }}
            />
          )}
        </div>

        <div className="user-details">
          <h3 className="user-name">{title}</h3>
          <span
            className={`user-status-text ${
              chatPartner?.isOnline ? "online" : "offline"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="header-actions">
          {isBot && botTopicOptions.length > 0 && (
            <div className="header-topic-wrap right" ref={topicPopupRef}>
              <button
                type="button"
                className={`header-topic-trigger ${
                  showTopicPopup ? "active" : ""
                }`}
                onClick={() => setShowTopicPopup((prev) => !prev)}
                title="Chon chu de AI"
              >
                <FiCpu size={14} />
                <span>{botTopic || "Chon chu de"}</span>
              </button>

              {showTopicPopup && (
                <div className="header-topic-popup">
                  {botTopicOptions.map((topic) => (
                    <button
                      key={topic.value}
                      type="button"
                      className={`header-topic-option ${
                        botTopic === topic.value ? "active" : ""
                      }`}
                      onClick={() => {
                        setBotTopic(topic.value);
                        setShowTopicPopup(false);
                      }}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            className="header-action-btn"
            onClick={onOpenSearch}
            title="Tim kiem tin nhan"
          >
            <HiSearch size={20} />
          </button>
          <button
            className="header-action-btn"
            onClick={onOpenSummary}
            title="Tom tat tin nhan"
          >
            <HiDocumentText size={20} />
          </button>
          <button
            className="header-action-btn"
            onClick={onOpenMedia}
            title="Anh / Video"
          >
            <HiPhotograph size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatHeader;
