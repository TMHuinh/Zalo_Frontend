import { useEffect, useState, useRef, useMemo } from "react";
import socket from "../socket/socket";
import messageApi from "../api/messageApi";
import conversationApi from "../api/conversationApi";
import toast from "react-hot-toast";
import userApi from "../api/userApi";
import "../css/chatMain.css";
import ChatHeader from "./ChatHeader";
import PinnedBar from "./PinnedBar";
import MessageList from "./MessageList";
import ChatFooter from "./ChatFooter";
import ForwardModal from "./ForwardModal";
import ConfirmModal from "./ConfirmModal";

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
  const [actionSideMap, setActionSideMap] = useState({});

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

      const pinnedRes = await conversationApi.getPinnedMessages(conversationId);
      const newPinned = pinnedRes.data.result || [];
      setPinnedMessages(newPinned);

      const pinnedItem = newPinned.find((item) => {
        const pinnedMsg = item?.messageId || item;
        return String(pinnedMsg?._id) === String(msg._id);
      });

      const updatedMessage = pinnedItem?.messageId ||
        pinnedItem || {
          ...msg,
          isPinned: true,
          conversationId,
        };

      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(msg._id)
            ? { ...m, ...updatedMessage, isPinned: true }
            : m,
        ),
      );

      const isGroup =
        conversation?.type === "group" || conversation?.members?.length > 2;

      const recipient = !isGroup
        ? conversation?.members?.find((m) => m.userId._id !== currentUserId)
            ?.userId?._id
        : null;

      socket.emit("pin_message", {
        type: isGroup ? "group" : "direct",
        groupId: isGroup ? conversationId : null,
        toUserId: !isGroup ? recipient : null,
        userId: currentUserId,
        message: updatedMessage,
      });

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

      const pinnedRes = await conversationApi.getPinnedMessages(conversationId);
      const newPinned = pinnedRes.data.result || [];
      setPinnedMessages(newPinned);

      const updatedMessage = {
        ...msg,
        isPinned: false,
        conversationId,
      };

      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(msg._id) ? { ...m, isPinned: false } : m,
        ),
      );

      if (newPinned.length <= 1) {
        setShowAllPinned(false);
      }

      const isGroup =
        conversation?.type === "group" || conversation?.members?.length > 2;

      const recipient = !isGroup
        ? conversation?.members?.find((m) => m.userId._id !== currentUserId)
            ?.userId?._id
        : null;

      socket.emit("unpin_message", {
        type: isGroup ? "group" : "direct",
        groupId: isGroup ? conversationId : null,
        toUserId: !isGroup ? recipient : null,
        userId: currentUserId,
        message: updatedMessage,
      });

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
    const msg = pinnedMsg?.messageId || pinnedMsg;
    if (!msg?._id) return;

    await handleUnpinMessage(msg);
    setPinnedMenuId(null);
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

  // ================ nhận socket pin, unpin============
  useEffect(() => {
    const handlePinned = async ({ message }) => {
      if (!message?._id) return;

      const convId = message?.conversationId?._id || message?.conversationId;

      if (String(convId) !== String(conversationId)) return;

      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(message._id)
            ? { ...m, ...message, isPinned: true }
            : m,
        ),
      );

      const res = await conversationApi.getPinnedMessages(convId);
      setPinnedMessages(res.data.result || []);
    };

    const handleUnpinned = async ({ message }) => {
      if (!message?._id) return;

      const convId = message?.conversationId?._id || message?.conversationId;

      if (String(convId) !== String(conversationId)) return;

      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(message._id) ? { ...m, isPinned: false } : m,
        ),
      );

      const res = await conversationApi.getPinnedMessages(convId);
      const newPinned = res.data.result || [];
      setPinnedMessages(newPinned);

      if (newPinned.length <= 1) {
        setShowAllPinned(false);
      }
    };

    socket.on("message_pinned", handlePinned);
    socket.on("message_unpinned", handleUnpinned);

    return () => {
      socket.off("message_pinned", handlePinned);
      socket.off("message_unpinned", handleUnpinned);
    };
  }, [conversationId]);

  // ======= nhận socket reacalll=========================
  useEffect(() => {
    const handleMessageReacted = ({ conversationId: convId, message }) => {
      if (!message) return;

      const msgConvId =
        convId || message?.conversationId?._id || message?.conversationId;

      if (msgConvId !== conversationId) return;

      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? message : m)),
      );
    };

    socket.on("message_reacted", handleMessageReacted);

    return () => {
      socket.off("message_reacted", handleMessageReacted);
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

      const isGroup =
        conversation?.type === "group" || conversation?.members?.length > 2;

      const recipient = !isGroup
        ? conversation?.members?.find((m) => m.userId._id !== currentUserId)
            ?.userId?._id
        : null;

      socket.emit("react_message", {
        type: isGroup ? "group" : "direct",
        groupId: isGroup ? conversationId : null,
        toUserId: !isGroup ? recipient : null,
        userId: currentUserId,
        message: updatedMessage,
      });

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

    const targetConversation = allConversations.find(
      (c) => String(c._id) === String(targetConvId),
    );

    if (!targetConversation) {
      toast.error("Không tìm thấy cuộc trò chuyện");
      return;
    }

    const forwardPayload = {
      conversationId: targetConvId,
      senderId: currentUserId,
      content: forwardContent.content || "",
      attachments: forwardContent.attachments || [],
      type: forwardContent.type || "text",
      replyToMessageId: null,
    };

    try {
      const res = await messageApi.sendMessage(forwardPayload);
      const saved = res.data.result;

      const isTargetGroup =
        targetConversation?.type === "group" ||
        targetConversation?.members?.length > 2;

      if (isTargetGroup) {
        socket.emit("send_group_message", {
          groupId: targetConvId,
          userId: currentUserId,
          message: saved,
        });
      } else {
        const recipient = targetConversation.members.find(
          (m) => m.userId?._id !== currentUserId,
        )?.userId?._id;

        if (recipient) {
          socket.emit("send_message", {
            userId: currentUserId,
            toUserId: recipient,
            message: saved,
          });
        }
      }

      onNewMessage?.({ conversationId: targetConvId, message: saved });

      setForwardModal(false);
      setForwardContent(null);
      toast.success("Chuyển tiếp thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi chuyển tiếp");
    }
  };

  const updateActionSide = (messageId, bubbleEl) => {
    if (!bubbleEl) return;

    const rect = bubbleEl.getBoundingClientRect();
    const actionWidth = 170; // 4 nút tròn + khoảng cách
    const gap = 12;

    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    let side = "right-side";

    // nếu bên phải không đủ chỗ thì chuyển action sang bên trái bubble
    if (spaceRight < actionWidth + gap && spaceLeft > spaceRight) {
      side = "left-side";
    }

    // nếu bên trái cũng không đủ mà bên phải đủ hơn thì ép sang phải
    if (spaceLeft < actionWidth + gap && spaceRight >= spaceLeft) {
      side = "right-side";
    }

    setActionSideMap((prev) => {
      if (prev[messageId] === side) return prev;
      return { ...prev, [messageId]: side };
    });
  };
  const getVerticalPosition = (el) => {
    if (!el) return "bottom";

    const rect = el.getBoundingClientRect();
    const spaceTop = rect.top;
    const spaceBottom = window.innerHeight - rect.bottom;

    // nếu dưới không đủ chỗ → mở lên trên
    if (spaceBottom < 120 && spaceTop > spaceBottom) {
      return "top";
    }

    return "bottom";
  };
  return (
    <div className="modern-chat-container">
      <ChatHeader
        isGroup={isGroup}
        conversation={conversation}
        chatPartner={chatPartner}
      />

      <PinnedBar
        pinnedMessages={pinnedMessages}
        showAllPinned={showAllPinned}
        setShowAllPinned={setShowAllPinned}
        pinnedMenuId={pinnedMenuId}
        setPinnedMenuId={setPinnedMenuId}
        pinnedMenuRef={pinnedMenuRef}
        pinnedDropdownRef={pinnedDropdownRef}
        scrollToMessage={scrollToMessage}
        getReplyPreviewText={getReplyPreviewText}
        handleUnpinFromBar={handleUnpinFromBar}
      />

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        conversation={conversation}
        isGroup={isGroup}
        getMessageRef={(id) => messageRefs.current[id]}
        setMessageRef={(id, el) => { messageRefs.current[id] = el; }}
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
        isAnyMenuOpen={isAnyMenuOpen}
        bottomRef={bottomRef}
      />

      <ChatFooter
        input={input}
        setInput={setInput}
        files={files}
        setFiles={setFiles}
        preview={preview}
        setPreview={setPreview}
        replyingMessage={replyingMessage}
        setReplyingMessage={setReplyingMessage}
        handleSend={handleSend}
        handleSendSticker={handleSendSticker}
        getSender={getSender}
        currentUserId={currentUserId}
        getReplyPreviewText={getReplyPreviewText}
      />

      <ForwardModal
        show={forwardModal}
        onHide={() => setForwardModal(false)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        forwardList={forwardList}
        handleSendForward={handleSendForward}
      />

      <ConfirmModal
        show={confirmModal.show}
        type={confirmModal.type}
        onHide={() => setConfirmModal({ show: false, type: "", msg: null })}
        onConfirm={executeAction}
      />
    </div>
  );
}

export default ChatMain;
