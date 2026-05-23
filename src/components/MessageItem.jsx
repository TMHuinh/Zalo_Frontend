import { FiDownload, FiCornerUpLeft, FiShare2, FiMoreHorizontal } from "react-icons/fi";

function MessageItem({
  msg,
  index,
  messages,
  currentUserId,
  isGroup,
  getMessageRef,
  setMessageRef,
  highlightedMessageId,
  hoveredMessageId,
  setHoveredMessageId,
  menuMessageId,
  setMenuMessageId,
  reactionPickerMessageId,
  setReactionPickerMessageId,
  actionSideMap,
  updateActionSide,
  getVerticalPosition,
  messageMenuRef,
  getUserColor,
  getSender,
  getReplyPreviewText,
  scrollToMessage,
  handleActionClick,
  handleReactMessage,
  isPinnedMessage,
  reactionEmojis,
}) {
  if (msg.isDeleted) return null;

  const senderId =
    typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
  const isMe = senderId === currentUserId;
  const sender = getSender(msg);
  const nextMsg = messages[index + 1];
  const nextSenderId = nextMsg
    ? typeof nextMsg.senderId === "object"
      ? nextMsg.senderId._id
      : nextMsg.senderId
    : null;
  const isLastOfBlock = senderId !== nextSenderId;

  const isSticker = msg.type === "sticker";

  const isOnlyImage =
    !msg.isRecalled &&
    !isSticker &&
    !msg.content &&
    msg.attachments?.length > 0 &&
    msg.attachments.every((f) => f.type === "image");

  const isMediaBubble = !msg.isRecalled && (isOnlyImage || isSticker);

  return (
    <div
      ref={(el) => {
        if (el) setMessageRef(msg._id, el);
      }}
      className={`message-row-modern ${isMe ? "me" : "other"} ${isLastOfBlock ? "margin-block" : ""} ${
        highlightedMessageId === msg._id ? "highlight-message" : ""
      }`}
      onMouseEnter={() => setHoveredMessageId(msg._id)}
      onMouseLeave={() => {
        setHoveredMessageId((prev) => (prev === msg._id ? null : prev));
      }}
    >
      {!isMe && (
        <div className="avatar-side">
          {isLastOfBlock && (
            <img
              src={
                sender?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${sender?.fullName}`
              }
              alt="avt"
              className="mini-avatar"
            />
          )}
        </div>
      )}
      <div className="message-content-group">
        <div className="bubble-wrapper-modern">
          <div
            ref={(el) => {
              if (
                el &&
                (hoveredMessageId === msg._id || menuMessageId === msg._id)
              ) {
                updateActionSide(msg._id, el);
              }
            }}
            className={`bubble-card ${
              isOnlyImage
                ? "image-bubble"
                : msg.type === "mixed"
                  ? "mixed-bubble"
                  : ""
            }`}
            style={
              isMediaBubble
                ? {
                    background: "transparent",
                    padding: 0,
                    boxShadow: "none",
                  }
                : {}
            }
          >
            {isGroup && !isMe && isLastOfBlock && (
              <span
                className="sender-label-zalo"
                style={{
                  color: getUserColor(senderId),
                  marginLeft: isOnlyImage ? "4px" : "0",
                  marginBottom: isOnlyImage ? "4px" : "3px",
                  textShadow: isOnlyImage
                    ? "0 1px 2px rgba(255,255,255,0.8)"
                    : "none",
                }}
              >
                {sender?.fullName}
              </span>
            )}

            {msg.isRecalled ? (
              <div className="recalled-msg">
                🚫 Tin nhắn đã được thu hồi
              </div>
            ) : (
              <div className="msg-inner-content">
                {msg.replyToMessageId && (
                  <div
                    className="reply-quoted-box clickable"
                    onClick={() => {
                      const replyId =
                        typeof msg.replyToMessageId === "object"
                          ? msg.replyToMessageId._id
                          : msg.replyToMessageId;

                      scrollToMessage(replyId);
                    }}
                  >
                    <div className="reply-quoted-sender">
                      {(() => {
                        const repliedMsg =
                          typeof msg.replyToMessageId === "object"
                            ? msg.replyToMessageId
                            : null;

                        if (!repliedMsg) return "Tin nhắn đã trả lời";

                        const repliedSender = getSender(repliedMsg);
                        const repliedSenderId =
                          typeof repliedMsg.senderId === "object"
                            ? repliedMsg.senderId._id
                            : repliedMsg.senderId;

                        return repliedSenderId === currentUserId
                          ? "Bạn"
                          : repliedSender?.fullName || "Người dùng";
                      })()}
                    </div>

                    <div className="reply-quoted-text">
                      {(() => {
                        const repliedMsg =
                          typeof msg.replyToMessageId === "object"
                            ? msg.replyToMessageId
                            : null;

                        if (!repliedMsg) return "Không xem được nội dung gốc";

                        return getReplyPreviewText(repliedMsg);
                      })()}
                    </div>
                  </div>
                )}

                {msg.type === "sticker" ? (
                  <img
                    src={msg.content}
                    alt="sticker"
                    className="msg-sticker-render"
                    style={{
                      maxWidth: "140px",
                      display: "block",
                      cursor: "pointer",
                      borderRadius: "8px",
                    }}
                    onClick={() => window.open(msg.content)}
                  />
                ) : (
                  <>
                    {msg.content && (
                      <p
                        className="msg-text"
                        dangerouslySetInnerHTML={{
                          __html: msg.content,
                        }}
                      />
                    )}
                    {msg.attachments?.map((file, i) => (
                      <div key={i} className="attachment-modern">
                        {file.type === "image" ? (
                          <img
                            src={file.url}
                            alt=""
                            className="msg-img-modern"
                            style={
                              isOnlyImage && i === 0
                                ? { marginTop: 0 }
                                : {}
                            }
                            onClick={() => window.open(file.url)}
                          />
                        ) : (
                          <div
                            className="file-card-modern"
                            onClick={() => window.open(file.url)}
                          >
                            <FiDownload /> <span>{file.fileName}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}

                <div className="msg-meta-zalo">
                  <span className="timestamp-zalo">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            )}
            {!msg.isRecalled && (
              <div
                className={`message-hover-actions ${
                  hoveredMessageId === msg._id || menuMessageId === msg._id
                    ? "show"
                    : ""
                } ${actionSideMap[msg._id] || (isMe ? "left-side" : "right-side")}`}
              >
                <button
                  type="button"
                  className="hover-action-btn"
                  title="Thả cảm xúc"
                  onClick={() =>
                    setReactionPickerMessageId(
                      reactionPickerMessageId === msg._id ? null : msg._id,
                    )
                  }
                >
                  🙂
                </button>

                <button
                  type="button"
                  className="hover-action-btn"
                  title="Trả lời"
                  onClick={() => handleActionClick(msg, "reply")}
                >
                  <FiCornerUpLeft />
                </button>

                <button
                  type="button"
                  className="hover-action-btn"
                  title="Chuyển tiếp"
                  onClick={() => handleActionClick(msg, "forward")}
                >
                  <FiShare2 />
                </button>

                <div
                  className="hover-action-menu-wrap"
                  ref={menuMessageId === msg._id ? messageMenuRef : null}
                >
                  <button
                    type="button"
                    className="hover-action-btn"
                    title="Khác"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuMessageId((prev) =>
                        prev === msg._id ? null : msg._id,
                      );
                      setReactionPickerMessageId(null);
                    }}
                  >
                    <FiMoreHorizontal />
                  </button>

                  {menuMessageId === msg._id && (
                    <div
                      className={`action-menu-dropdown modern 
    ${isMe ? "left" : "right"} 
    ${getVerticalPosition(getMessageRef(msg._id))}
  `}
                    >
                      <button
                        className="menu-item"
                        onClick={() => handleActionClick(msg, "pin")}
                      >
                        {isPinnedMessage(msg._id) ? "Gỡ ghim" : "Ghim"}
                      </button>

                      {isMe && (
                        <button
                          className="menu-item"
                          onClick={() => handleActionClick(msg, "revoke")}
                        >
                          Thu hồi
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {msg.reactions?.length > 0 && (
            <div className="reaction-summary">
              {[
                ...new Map(
                  msg.reactions.map((r) => [r.emoji, r]),
                ).values(),
              ].map((r) => {
                const count = msg.reactions.filter(
                  (item) => item.emoji === r.emoji,
                ).length;

                return (
                  <span key={r.emoji} className="reaction-badge">
                    {r.emoji} {count > 1 ? count : ""}
                  </span>
                );
              })}
            </div>
          )}
          {reactionPickerMessageId === msg._id && !msg.isRecalled && (
            <div
              className={`reaction-picker-floating 
    ${isMe ? "me" : "other"} 
    ${getVerticalPosition(getMessageRef(msg._id))}
  `}
            >
              {reactionEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="reaction-emoji-btn"
                  onClick={() => handleReactMessage(msg, emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageItem;
