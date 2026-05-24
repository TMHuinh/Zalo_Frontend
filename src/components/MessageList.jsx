import MessageItem from "./MessageItem";

function MessageList({
  messages,
  currentUserId,
  conversation,
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
  isAnyMenuOpen,
  bottomRef,
}) {
  return (
    <div
      className={`chat-body-modern ${isAnyMenuOpen ? "scroll-locked" : ""}`}
    >
      {messages.map((msg, index) => {
        // 1. RENDER TIN NHẮN HỆ THỐNG (ZALO STYLE)
        if (msg.type === "system") {
          return (
            <div
              key={msg._id}
              className="d-flex justify-content-center align-items-center w-100"
              style={{ margin: "16px 0", clear: "both" }}
            >
              <div
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.06)",
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: "600",
                  padding: "6px 16px",
                  borderRadius: "24px",
                  maxWidth: "85%",
                  textAlign: "center",
                  userSelect: "none",
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        }

        // 2. RENDER TIN NHẮN BÌNH THƯỜNG (BONG BÓNG CHAT)
        return (
          <MessageItem
            key={msg._id}
            msg={msg}
            index={index}
            messages={messages}
            currentUserId={currentUserId}
            conversation={conversation}
            isGroup={isGroup}
            getMessageRef={getMessageRef}
            setMessageRef={setMessageRef}
            highlightedMessageId={highlightedMessageId}
            hoveredMessageId={hoveredMessageId}
            setHoveredMessageId={setHoveredMessageId}
            menuMessageId={menuMessageId}
            setMenuMessageId={setMenuMessageId}
            reactionPickerMessageId={reactionPickerMessageId}
            setReactionPickerMessageId={setReactionPickerMessageId}
            actionSideMap={actionSideMap}
            updateActionSide={updateActionSide}
            getVerticalPosition={getVerticalPosition}
            messageMenuRef={messageMenuRef}
            getUserColor={getUserColor}
            getSender={getSender}
            getReplyPreviewText={getReplyPreviewText}
            scrollToMessage={scrollToMessage}
            handleActionClick={handleActionClick}
            handleReactMessage={handleReactMessage}
            isPinnedMessage={isPinnedMessage}
            reactionEmojis={reactionEmojis}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;