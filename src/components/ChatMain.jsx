import { useEffect, useState, useRef, useMemo } from "react";
import socket from "../socket/socket";
import messageApi from "../api/messageApi";
import conversationApi from "../api/conversationApi";
import userApi from "../api/userApi";
import StickerPicker from "../components/StickerPicker";
import {
  FiPaperclip,
  FiSend,
  FiMoreHorizontal,
  FiImage,
  FiDownload,
  FiPlusCircle,
  FiSmile,
  FiSearch,
  FiAlertCircle,
  FiCornerUpLeft,
  FiShare2,
} from "react-icons/fi";
import { Modal, Button, ListGroup, Image } from "react-bootstrap";
import toast, { Toaster } from "react-hot-toast";
import "../css/chatMain.css";
import { HiUserGroup } from "react-icons/hi";

function ChatMain({
  currentUserId,
  conversation,
  onNewMessage,
  onMessageRecalled,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [menuMessageId, setMenuMessageId] = useState(null);

  const [chatPartner, setChatPartner] = useState(null);
  const [forwardModal, setForwardModal] = useState(false);
  const [allConversations, setAllConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [forwardContent, setForwardContent] = useState(null);

  const [replyingMessage, setReplyingMessage] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showAllPinned, setShowAllPinned] = useState(false);
  const [pinnedMenuId, setPinnedMenuId] = useState(null);
  const messageRefs = useRef({});
  const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];
  const messageMenuRef = useRef(null);
  const pinnedMenuRef = useRef(null);
  const pinnedDropdownRef = useRef(null);

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: "",
    msg: null,
  });

  const bottomRef = useRef(null);
  const conversationId = conversation?._id;
  const isGroup =
    conversation?.type === "group" || conversation?.members?.length > 2;

  const isAnyMenuOpen = menuMessageId !== null || pinnedMenuId !== null;
  // ==== xử lý sticker===========================
  const handleSendSticker = async (stickerUrl) => {
    if (!conversationId) return;

    const payload = {
      conversationId,
      senderId: currentUserId,
      content: stickerUrl,
      type: "sticker",
    };

    try {
      const res = await messageApi.sendMessage(payload);
      const saved = res.data.result;

      // update UI
      setMessages((prev) => [...prev, saved]);

      const isGroup =
        conversation?.type === "group" || conversation?.members?.length > 2;

      if (isGroup) {
        // ✅ CHAT NHÓM
        socket.emit("send_group_message", {
          groupId: conversationId,
          userId: currentUserId,
          message: saved,
        });
      } else {
        // ✅ CHAT ĐƠN
        const recipient = conversation.members.find(
          (m) => m.userId?._id !== currentUserId,
        )?.userId?._id;

        if (!recipient) return;

        socket.emit("send_message", {
          userId: currentUserId,
          toUserId: recipient, // 🔥 chỉ 1 user
          message: saved,
        });
      }

      onNewMessage?.({ conversationId, message: saved });
    } catch (err) {
      toast.error("Không thể gửi sticker");
    }
  };

  // ===== QUẢN LÝ NGƯỜI CHAT VÀ TRẠNG THÁI ONLINE =====
  useEffect(() => {
    const getPartnerInfo = async () => {
      if (!isGroup && conversation?.members) {
        const partnerId = conversation.members.find(
          (m) => m.userId?._id !== currentUserId,
        )?.userId?._id;
        if (partnerId) {
          try {
            const res = await userApi.getById(partnerId);
            setChatPartner(res.data.result || res.data);
          } catch (err) {
            console.error("Lỗi khi lấy thông tin user:", err);
            setChatPartner(
              conversation.members.find((m) => m.userId?._id !== currentUserId)
                ?.userId,
            );
          }
        }
      } else {
        setChatPartner(null);
      }
    };
    getPartnerInfo();
  }, [conversation, currentUserId, isGroup]);

  useEffect(() => {
    const handleOnline = (userId) =>
      setChatPartner((prev) =>
        prev && prev._id === userId ? { ...prev, isOnline: true } : prev,
      );
    const handleOffline = (userId) =>
      setChatPartner((prev) =>
        prev && prev._id === userId ? { ...prev, isOnline: false } : prev,
      );

    socket.on("user_online", handleOnline);
    socket.on("user_offline", handleOffline);
    return () => {
      socket.off("user_online", handleOnline);
      socket.off("user_offline", handleOffline);
    };
  }, []);

  // ===== TỐI ƯU HÓA DANH SÁCH CHUYỂN TIẾP =====
  const forwardList = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return allConversations
      .map((c) => {
        const otherUser = c.members.find(
          (m) => m.userId?._id !== currentUserId,
        )?.userId;
        const isGroupChat = c.type === "group" || c.members.length > 2;
        const name = isGroupChat
          ? c.name || "Nhóm chat"
          : otherUser?.fullName || "Unknown";
        return { ...c, isGroupChat, otherUser, name };
      })
      .filter((c) => c.name.toLowerCase().includes(keyword));
  }, [allConversations, currentUserId, searchTerm]);

  const getUserColor = (userId) => {
    if (!userId) return "#0084ff";
    const colors = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#F333FF",
      "#FF33A1",
      "#33FFF6",
      "#FF8333",
      "#8D33FF",
      "#33FF8A",
      "#FF3333",
      "#00A8FF",
      "#9C27B0",
      "#4CAF50",
      "#E91E63",
      "#FF9800",
      "#009688",
      "#673AB7",
      "#FFC107",
      "#795548",
      "#607D8B",
    ];
    let hash = 5381;
    for (let i = 0; i < userId.length; i++)
      hash = (hash * 33) ^ userId.charCodeAt(i);
    return colors[Math.abs(hash % colors.length)];
  };

  const getSender = (msg) => {
    const senderId =
      typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
    return conversation?.members.find((m) => m.userId?._id === senderId)
      ?.userId;
  };

  const getReplyPreviewText = (msg) => {
    if (!msg) return "";

    if (msg.isRecalled) return "Tin nhắn đã được thu hồi";
    if (msg.type === "sticker") return "[Sticker]";
    if (msg.attachments?.length > 0 && !msg.content) {
      if (msg.attachments.every((f) => f.type === "image")) return "[Hình ảnh]";
      return "[Tệp đính kèm]";
    }

    return msg.content || "";
  };
  const scrollToMessage = (messageId) => {
    if (!messageId) return;

    const el = messageRefs.current[messageId];
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setHighlightedMessageId(messageId);

    setTimeout(() => {
      setHighlightedMessageId((prev) => (prev === messageId ? null : prev));
    }, 1800);
  };

  const handlePinMessage = async (msg) => {
    try {
      await conversationApi.pinMessage({
        conversationId,
        messageId: msg._id,
      });

      const res = await conversationApi.getPinnedMessages(conversationId);
      setPinnedMessages(res.data.result || []);
      toast.success("Đã ghim tin nhắn");
    } catch (error) {
      console.error(error);
      toast.error("Ghim tin nhắn thất bại");
    }
  };

  const handleUnpinMessage = async (msg) => {
    try {
      await conversationApi.unpinMessage({
        conversationId,
        messageId: msg._id,
      });

      const res = await conversationApi.getPinnedMessages(conversationId);
      setPinnedMessages(res.data.result || []);
      toast.success("Đã bỏ ghim");
    } catch (error) {
      console.error(error);
      toast.error("Bỏ ghim thất bại");
    }
  };

  const isPinnedMessage = (messageId) => {
    return pinnedMessages.some((item) => {
      const pinnedId = item?.messageId?._id || item?.messageId || item?._id;
      return pinnedId === messageId;
    });
  };
  // ===== bỏ ghim trên thanh ghim=======
  const handleUnpinFromBar = async (pinnedMsg) => {
    try {
      const msg = pinnedMsg?.messageId || pinnedMsg;
      if (!msg?._id) return;

      await conversationApi.unpinMessage({
        conversationId,
        messageId: msg._id,
      });

      const res = await conversationApi.getPinnedMessages(conversationId);
      setPinnedMessages(res.data.result || []);
      setPinnedMenuId(null);
      toast.success("Đã bỏ ghim");
    } catch (error) {
      console.error(error);
      toast.error("Bỏ ghim thất bại");
    }
  };
  // ========================================================================================================================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ==========================================================================================================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideMessageMenu =
        messageMenuRef.current && messageMenuRef.current.contains(e.target);

      const clickedInsidePinnedMenu =
        pinnedMenuRef.current && pinnedMenuRef.current.contains(e.target);

      const clickedInsidePinnedDropdown =
        pinnedDropdownRef.current &&
        pinnedDropdownRef.current.contains(e.target);

      if (!clickedInsideMessageMenu) {
        setMenuMessageId(null);
      }

      if (!clickedInsidePinnedMenu) {
        setPinnedMenuId(null);
      }

      if (!clickedInsidePinnedDropdown) {
        setShowAllPinned(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // ================================================================================================
  useEffect(() => {
    if (!conversationId) return;

    setShowAllPinned(false);
    setPinnedMenuId(null);

    messageApi
      .getMessages(conversationId)
      .then((res) => setMessages(res.data.result.data.reverse()))
      .catch(console.error);

    conversationApi
      .getPinnedMessages(conversationId)
      .then((res) => setPinnedMessages(res.data.result || []))
      .catch(console.error);

    socket.emit("join_conversation", conversationId);

    const handleReceivePrivate = (data) => {
      const msg = data.message;
      if (!msg || !msg._id) return;
      if (msg.conversationId && msg.conversationId !== conversationId) return;

      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
      );
    };

    const handleReceiveGroup = (data) => {
      const msg = data.message;
      if (!msg || !msg._id) return;
      if (data.groupId !== conversationId) return;

      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
      );
    };

    const handleRecalled = ({ messageId }) =>
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isRecalled: true } : m)),
      );
    const handleMessageUpdated = (updatedMessage) => {
      if (!updatedMessage?._id) return;

      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)),
      );
    };

    socket.on("receive_message", handleReceivePrivate);
    socket.on("receive_group_message", handleReceiveGroup);
    socket.on("message_recalled", handleRecalled);
    socket.on("message_updated", handleMessageUpdated);

    return () => {
      socket.emit("leave_conversation", conversationId);
      socket.off("receive_message", handleReceivePrivate);
      socket.off("receive_group_message", handleReceiveGroup);
      socket.off("message_recalled", handleRecalled);
      socket.off("message_updated", handleMessageUpdated);
    };
  }, [conversationId]);

  const handleSend = async () => {
    if (!conversationId || (!input.trim() && files.length === 0)) return;

    const formData = new FormData();
    formData.append("conversationId", conversationId);
    formData.append("content", input);
    formData.append("senderId", currentUserId);

    if (replyingMessage?._id) {
      formData.append("replyToMessageId", replyingMessage._id);
    }

    files.forEach((file) => formData.append("files", file));

    try {
      if (conversation?.type === "bot") {
        const payload = {
          conversationId,
          content: input,
        };

        const res = await messageApi.sendChatbotMessage(payload);
        const { userMessage, botMessage } = res.data.result;

        setMessages((prev) => [...prev, userMessage, botMessage]);
        onNewMessage?.({ conversationId, message: botMessage });
      } else {
        const res = await messageApi.sendMessage(formData);
        const saved = res.data.result;

        setMessages((prev) => [...prev, saved]);

        const isGroup =
          conversation?.type === "group" || conversation?.members?.length > 2;

        if (isGroup) {
          socket.emit("send_group_message", {
            groupId: conversationId,
            userId: currentUserId,
            message: saved,
          });
        } else {
          const recipient = conversation.members.find(
            (m) => m.userId._id !== currentUserId,
          )?.userId._id;

          socket.emit("send_message", {
            userId: currentUserId,
            toUserId: recipient,
            message: saved,
          });
        }

        onNewMessage?.({ conversationId, message: saved });
      }

      setInput("");
      setFiles([]);
      setPreview([]);
      setReplyingMessage(null);
    } catch (err) {
      console.error(err);
      toast.error("Gửi tin nhắn thất bại");
    }
  };
  const handleReactMessage = async (msg, emoji) => {
    try {
      const res = await messageApi.reactMessage({
        messageId: msg._id,
        emoji,
      });

      const updatedMessage = res.data.result;

      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)),
      );

      setReactionPickerMessageId(null);
    } catch (error) {
      console.error(error);
      toast.error("Thả cảm xúc thất bại");
    }
  };

  const executeAction = async () => {
    const { type, msg } = confirmModal;
    try {
      if (type === "revoke") {
        const res = await messageApi.revokeMessage(msg._id);
        const updatedMsg = res.data.result || res.data;

        setMessages((prev) =>
          prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m)),
        );

        onMessageRecalled?.({
          conversationId,
          messageId: msg._id,
        });

        const isGroupChat =
          conversation?.type === "group" || conversation?.members?.length > 2;

        if (isGroupChat) {
          socket.emit("recall_message", {
            type: "group",
            groupId: conversationId,
            conversationId,
            messageId: msg._id,
          });
        } else {
          const recipient = conversation.members.find(
            (m) => m.userId?._id !== currentUserId,
          )?.userId?._id;

          if (recipient) {
            socket.emit("recall_message", {
              type: "direct",
              toUserId: recipient,
              conversationId,
              messageId: msg._id,
            });
          }
        }

        toast.success("Đã thu hồi tin nhắn");
      } else if (type === "delete") {
        await messageApi.deleteMessage(msg._id);
        setMessages((prev) => prev.filter((m) => m._id !== msg._id));
        toast.success("Đã xóa phía bạn");
      }
    } catch (err) {
      toast.error("Thao tác thất bại");
    } finally {
      setConfirmModal({ show: false, type: "", msg: null });
    }
  };

  const handleActionClick = async (msg, type) => {
    if (type === "reply") {
      setReplyingMessage(msg);
    } else if (type === "pin") {
      if (isPinnedMessage(msg._id)) {
        await handleUnpinMessage(msg);
      } else {
        await handlePinMessage(msg);
      }
    } else if (type === "forward") {
      setForwardContent(msg);
      setForwardModal(true);
      conversationApi
        .getByUserId()
        .then((res) =>
          setAllConversations(res.data.result || res.data.data || []),
        );
    } else {
      setConfirmModal({ show: true, type, msg });
    }

    setMenuMessageId(null);
  };

  const handleSendForward = async (targetConvId) => {
    if (!forwardContent) return;

    // Sử dụng Object JSON thay vì FormData để chuyển tiếp mượt mà hơn
    const forwardPayload = {
      conversationId: targetConvId,
      senderId: currentUserId,
      content: forwardContent.content || "",
      attachments: forwardContent.attachments || [],
    };

    try {
      await messageApi.sendMessage(forwardPayload);
      setForwardModal(false);
      toast.success("Chuyển tiếp thành công!");
    } catch (err) {
      toast.error("Lỗi khi chuyển tiếp");
    }
  };

  return (
    <div className="modern-chat-container">
      <Toaster position="top-center" reverseOrder={false} />

      {/* HEADER */}
      <div className="chat-header-modern">
        <div className="header-content">
          <div className="avatar-wrapper">
            {isGroup ? (
              // Kiểm tra nếu nhóm có avatar thì hiện ảnh, không thì hiện icon giống ChatList
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
                  {/* Nhớ import { HiUserGroup } from "react-icons/hi" ở đầu file */}
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

            {/* Chấm xanh online chỉ hiện cho chat cá nhân */}
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
                ? conversation.name || "Nhóm chat"
                : chatPartner?.fullName}
            </h3>
            <span
              className={`user-status-text ${chatPartner?.isOnline ? "online" : "offline"}`}
            >
              {isGroup
                ? `${conversation.members?.length || 0} thành viên`
                : chatPartner?.isOnline
                  ? "Đang hoạt động"
                  : "Offline"}
            </span>
          </div>
        </div>
      </div>
      {pinnedMessages.length > 0 &&
        (() => {
          const firstPinned = pinnedMessages[0]?.messageId || pinnedMessages[0];
          const extraCount = pinnedMessages.length - 1;

          return (
            <div className="pinned-bar-facebook">
              <div className="pinned-bar-facebook-main">
                <div className="pinned-facebook-left">
                  <div className="pinned-facebook-icon">💬</div>

                  <div
                    className="pinned-facebook-content"
                    onClick={() => {
                      if (!firstPinned?._id) return;
                      scrollToMessage(firstPinned._id);
                      setPinnedMenuId(null);
                    }}
                  >
                    <div className="pinned-facebook-title">Tin nhắn</div>
                    <div className="pinned-facebook-text">
                      {getReplyPreviewText(firstPinned)}
                    </div>
                  </div>
                </div>

                <div className="pinned-facebook-actions">
                  {/* Case nhiều tin */}
                  {extraCount > 0 && (
                    <button
                      type="button"
                      className={`pinned-facebook-more ${showAllPinned ? "expanded" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllPinned((prev) => !prev);
                        setPinnedMenuId(null);
                      }}
                    >
                      +{extraCount} ghim <span className="caret">▾</span>
                    </button>
                  )}

                  {/* Case chỉ có 1 tin */}
                  {extraCount === 0 && (
                    <div
                      className="pinned-single-menu-wrap"
                      ref={
                        pinnedMenuId === firstPinned?._id ? pinnedMenuRef : null
                      }
                    >
                      <button
                        type="button"
                        className="pinned-single-more-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPinnedMenuId((prev) =>
                            prev === firstPinned?._id ? null : firstPinned?._id,
                          );
                        }}
                      >
                        <FiMoreHorizontal />
                      </button>

                      {pinnedMenuId === firstPinned?._id && (
                        <div
                          className="pinned-single-dropdown"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="pinned-single-dropdown-item unpin"
                            onClick={() => handleUnpinFromBar(firstPinned)}
                          >
                            Bỏ ghim
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {showAllPinned && (
                <div
                  className="pinned-facebook-dropdown"
                  ref={pinnedDropdownRef}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="pinned-facebook-dropdown-header">
                    <span>Danh sách ghim ({pinnedMessages.length})</span>
                    <button
                      type="button"
                      className="pinned-facebook-collapse"
                      onClick={() => setShowAllPinned(false)}
                    >
                      Thu gọn <span>⌃</span>
                    </button>
                  </div>

                  <div className="pinned-facebook-list">
                    {pinnedMessages.map((item, index) => {
                      const pinnedMsg = item.messageId || item;
                      const pinnedId = pinnedMsg?._id;

                      return (
                        <div
                          key={pinnedId || index}
                          className="pinned-facebook-item"
                        >
                          <div
                            className="pinned-facebook-item-body"
                            onClick={() => {
                              if (!pinnedId) return;
                              scrollToMessage(pinnedId);
                              setShowAllPinned(false);
                              setPinnedMenuId(null);
                            }}
                          >
                            <div className="pinned-facebook-item-title">
                              Tin nhắn
                            </div>
                            <div className="pinned-facebook-item-text">
                              {getReplyPreviewText(pinnedMsg)}
                            </div>
                          </div>

                          <div
                            className="pinned-facebook-item-actions"
                            ref={
                              pinnedMenuId === pinnedId ? pinnedMenuRef : null
                            }
                          >
                            <button
                              type="button"
                              className="pinned-facebook-item-more"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPinnedMenuId((prev) =>
                                  prev === pinnedId ? null : pinnedId,
                                );
                              }}
                            >
                              <FiMoreHorizontal />
                            </button>

                            {pinnedMenuId === pinnedId && (
                              <div
                                className="pinned-facebook-item-menu"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className="pinned-facebook-item-menu-btn unpin"
                                  onClick={() => handleUnpinFromBar(item)}
                                >
                                  Bỏ ghim
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      <div
        className={`chat-body-modern ${isAnyMenuOpen ? "scroll-locked" : ""}`}
      >
        {messages.map((msg, index) => {
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

          // 🔥 CẢI TIẾN LOGIC: Nếu đã thu hồi (isRecalled) thì KHÔNG tính là only image nữa
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
              key={msg._id}
              ref={(el) => {
                if (el) messageRefs.current[msg._id] = el;
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
                    className="bubble-card"
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
                      // KHI THU HỒI SẼ HIỆN RA KHUNG BÌNH THƯỜNG
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

                                if (!repliedMsg)
                                  return "Không xem được nội dung gốc";

                                return getReplyPreviewText(repliedMsg);
                              })()}
                            </div>
                          </div>
                        )}

                        {msg.type === "sticker" ? (
                          /* HIỂN THỊ STICKER */
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
                          /* HIỂN THỊ TEXT VÀ FILE NHƯ CŨ */
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

                        {/* Giữ nguyên phần Meta (thời gian) */}
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
                          hoveredMessageId === msg._id ||
                          menuMessageId === msg._id
                            ? "show"
                            : ""
                        } ${isMe ? "left-side" : "right-side"}`}
                      >
                        <button
                          type="button"
                          className="hover-action-btn"
                          title="Thả cảm xúc"
                          onClick={() =>
                            setReactionPickerMessageId(
                              reactionPickerMessageId === msg._id
                                ? null
                                : msg._id,
                            )
                          }
                        >
                          👍
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
                          ref={
                            menuMessageId === msg._id ? messageMenuRef : null
                          }
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
                              className={`action-menu-dropdown modern ${isMe ? "left" : "right"}`}
                              onClick={(e) => e.stopPropagation()}
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
                                  onClick={() =>
                                    handleActionClick(msg, "revoke")
                                  }
                                >
                                  Thu hồi
                                </button>
                              )}

                              <button
                                className="menu-item delete"
                                onClick={() => handleActionClick(msg, "delete")}
                              >
                                Xóa phía tôi
                              </button>
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
                      className={`reaction-picker-floating ${isMe ? "me" : "other"}`}
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
        })}
        <div ref={bottomRef} />
      </div>

      {/* FOOTER */}
      <div className="chat-footer-modern">
        {preview.length > 0 && (
          <div className="preview-bar-modern">
            {preview.map((p, i) => (
              <div key={i} className="preview-thumb">
                <img src={p} alt="" />
                <div
                  className="remove-pre"
                  onClick={() => {
                    setFiles([]);
                    setPreview([]);
                  }}
                >
                  ×
                </div>
              </div>
            ))}
          </div>
        )}
        {replyingMessage && (
          <div className="reply-preview-bar">
            <div className="reply-preview-content">
              <div className="reply-preview-title">
                Đang trả lời{" "}
                {(() => {
                  const sender = getSender(replyingMessage);
                  const senderId =
                    typeof replyingMessage.senderId === "object"
                      ? replyingMessage.senderId._id
                      : replyingMessage.senderId;

                  return senderId === currentUserId
                    ? "chính bạn"
                    : sender?.fullName || "người dùng";
                })()}
              </div>

              <div className="reply-preview-text">
                {getReplyPreviewText(replyingMessage)}
              </div>
            </div>

            <button
              type="button"
              className="reply-preview-close"
              onClick={() => setReplyingMessage(null)}
            >
              ×
            </button>
          </div>
        )}
        <div className="input-wrapper-refined">
          <div className="action-buttons-left">
            <input
              type="file"
              id="f-upload-modern"
              hidden
              multiple
              onChange={(e) => {
                const selected = Array.from(e.target.files);
                setFiles(selected);
                setPreview(selected.map((f) => URL.createObjectURL(f)));
              }}
            />
            <button
              className="btn-action-refined pulse"
              onClick={() => document.getElementById("f-upload-modern").click()}
            >
              <FiPlusCircle />
            </button>
            <button
              className="btn-action-refined"
              onClick={() => document.getElementById("f-upload-modern").click()}
            >
              <FiImage />
            </button>
          </div>
          <div
            className={`input-field-refined ${input.trim() ? "has-content" : ""}`}
          >
            <textarea
              className="textarea-refined"
              placeholder="Viết tin nhắn..."
              rows="1"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "inherit";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                  e.target.style.height = "inherit";
                }
              }}
            />
            <StickerPicker onSelect={handleSendSticker} />
            {/* <button className="btn-emoji-refined">
              <FiSmile />
            </button> */}
          </div>
          <div className="action-buttons-right">
            <button
              className={`btn-send-refined ${input.trim() || files.length > 0 ? "active" : ""}`}
              onClick={handleSend}
              disabled={!input.trim() && files.length === 0}
            >
              <FiSend />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL FORWARD */}
      <Modal
        show={forwardModal}
        onHide={() => setForwardModal(false)}
        centered
        className="forward-modal shadow-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "18px", fontWeight: "bold" }}>
            Chuyển tiếp tin nhắn
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "0" }}>
          <div className="forward-search p-3">
            <div className="search-box-wrapper">
              <FiSearch />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div
            className="forward-list"
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
            <ListGroup variant="flush">
              {forwardList.map((c) => (
                <ListGroup.Item
                  key={c._id}
                  onClick={() => handleSendForward(c._id)}
                  className="d-flex align-items-center gap-3 py-3 border-0 border-bottom"
                  style={{ cursor: "pointer", backgroundColor: "transparent" }}
                >
                  <div className="forward-avatar">
                    {c.isGroupChat ? (
                      <div className="text-avatar-forward">👥</div>
                    ) : c.otherUser?.avatarUrl ? (
                      <Image
                        src={c.otherUser.avatarUrl}
                        roundedCircle
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className="text-avatar-forward">
                        {c.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="forward-info">
                    <div className="name" style={{ fontWeight: "500" }}>
                      {c.name}
                    </div>
                    <div
                      className="sub"
                      style={{ fontSize: "12px", color: "#72808e" }}
                    >
                      {c.isGroupChat
                        ? `${c.members.length} thành viên`
                        : "Cá nhân"}
                    </div>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="ms-auto"
                    style={{ borderRadius: "20px", padding: "4px 12px" }}
                  >
                    Gửi
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={confirmModal.show}
        onHide={() => setConfirmModal({ show: false, type: "", msg: null })}
        centered
        className="confirm-modal"
      >
        <Modal.Body className="text-center p-4">
          <div className="confirm-icon mb-3">
            <FiAlertCircle
              size={50}
              color={confirmModal.type === "revoke" ? "#ff9800" : "#f44336"}
            />
          </div>
          <h5 className="mb-2" style={{ fontWeight: "bold" }}>
            {confirmModal.type === "revoke"
              ? "Thu hồi tin nhắn?"
              : "Xóa tin nhắn?"}
          </h5>
          <p className="text-muted mb-4">
            {confirmModal.type === "revoke"
              ? "Tin nhắn này sẽ bị gỡ bỏ đối với tất cả thành viên."
              : "Tin nhắn này sẽ chỉ bị xóa ở phía bạn."}
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <Button
              variant="light"
              onClick={() =>
                setConfirmModal({ show: false, type: "", msg: null })
              }
              style={{ borderRadius: "10px", padding: "8px 25px" }}
            >
              Hủy
            </Button>
            <Button
              variant={confirmModal.type === "revoke" ? "warning" : "danger"}
              onClick={executeAction}
              style={{
                borderRadius: "10px",
                padding: "8px 25px",
                color: "white",
              }}
            >
              {confirmModal.type === "revoke" ? "Thu hồi" : "Xóa"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default ChatMain;
