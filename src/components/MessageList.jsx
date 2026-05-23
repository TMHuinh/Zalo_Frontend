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
      {messages.map((msg, index) => (
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
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
