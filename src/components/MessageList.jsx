import { useRef, useEffect, useLayoutEffect, useCallback } from "react";
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
  loadMore,
  isLoadingMore,
  hasMore,
}) {
  const containerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const prevMessagesLengthRef = useRef(messages.length);
  const isPrependingRef = useRef(false);

  // 🔥 1. Cờ theo dõi để biết khi nào MỚI MỞ CHAT
  const prevConvIdRef = useRef(conversation?._id);
  const initialScrollDoneRef = useRef(false);

  // Reset cờ khi chuyển đoạn chat
  if (conversation?._id !== prevConvIdRef.current) {
    prevConvIdRef.current = conversation?._id;
    initialScrollDoneRef.current = false;
    isPrependingRef.current = false;
    prevScrollTopRef.current = 0;
  }

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasMore || isLoadingMore) return; 

    const { scrollTop, scrollHeight } = el;
    
    // 🔥 2. XÁC ĐỊNH HƯỚNG CUỘN (CHỈ KÍCH HOẠT KHI CUỘN LÊN)
    const isScrollingUp = scrollTop < prevScrollTopRef.current;
    prevScrollTopRef.current = scrollTop;

    // NẾU CHƯA CUỘN XONG LẦN ĐẦU, HOẶC LÀ CUỘN XUỐNG DƯỚI -> CHẶN GỌI API!
    if (!initialScrollDoneRef.current || !isScrollingUp) return;
    
    // Chỉ gọi API load tin nhắn cũ khi thực sự đang vuốt lên
    if (scrollTop < 150) {
      prevScrollHeightRef.current = scrollHeight;
      isPrependingRef.current = true;
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // 🔥 3. QUẢN LÝ VỊ TRÍ CUỘN THÔNG MINH
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // TRƯỜNG HỢP A: MỚI MỞ ĐOẠN CHAT
    if (!initialScrollDoneRef.current && messages.length > 0) {
      // 1. Nhảy thẳng xuống đáy ngay lập tức
      el.scrollTop = el.scrollHeight;
      prevScrollTopRef.current = el.scrollTop;
      
      // 2. Khóa sự kiện scroll trong 300ms. Chờ ảnh load xong nhảy lại đáy lần nữa cho chắc!
      const timer = setTimeout(() => {
        if (el) {
          el.scrollTop = el.scrollHeight;
          prevScrollTopRef.current = el.scrollTop;
        }
        initialScrollDoneRef.current = true; // Mở khóa cho phép người dùng cuộn lên
      }, 300);

      return () => clearTimeout(timer);
    } 
    
    // TRƯỜNG HỢP B: LOAD THÊM TIN NHẮN CŨ
    if (isPrependingRef.current && messages.length > prevMessagesLengthRef.current) {
      const newScrollHeight = el.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      
      if (diff > 0) {
        // Bù trừ vị trí cuộn cực mượt, không bị chớp giật
        el.scrollTop = el.scrollTop + diff;
        prevScrollTopRef.current = el.scrollTop;
      }
      isPrependingRef.current = false;
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  return (
    <div
      ref={containerRef}
      className={`chat-body-modern ${isAnyMenuOpen ? "scroll-locked" : ""}`}
    >
      {hasMore && (
        <div className="load-more-sentinel">
          {isLoadingMore && (
            <div className="load-more-spinner">Đang tải tin nhắn cũ...</div>
          )}
        </div>
      )}

      {messages.length > 0 && !hasMore && (
        <div className="load-more-end">Đã xem tất cả tin nhắn</div>
      )}

      {messages.map((msg, index) => {
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