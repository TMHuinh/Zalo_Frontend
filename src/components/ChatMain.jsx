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
import SearchModal from "./SearchModal";
import MediaGallery from "./MediaGallery";
import SummaryModal from "./SummaryModal";
import ViolationWarningModal from "./ViolationWarningModal";

const DEFAULT_BOT_TOPIC = "Thể thao";
const BOT_TOPIC_OPTIONS = [
  "Ẩm thực",
  "Thể thao",
  "Sức khỏe",
  "Làm đẹp",
  "Thời trang",
  "Du lịch",
  "Giáo dục",
  "Công nghệ",
  "Giải trí",
  "Âm nhạc",
  "Phim ảnh",
  "Sách",
].map((topic) => ({ value: topic, label: topic }));

function ChatMain({
  currentUserId,
  conversation,
  onNewMessage,
  onMessageRecalled,
  onCloseConversation,
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

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [violationModal, setViolationModal] = useState({
    show: false,
    content: "",
    message: "",
  });
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedBotTopic, setSelectedBotTopic] = useState(DEFAULT_BOT_TOPIC);

  const bottomRef = useRef(null);
  const isLoadingMoreRef = useRef(false); // Dùng để khóa gọi API liên tục
  const prevLastMessageIdRef = useRef(null);
  const conversationId = conversation?._id;
  const isBot = conversation?.type === "bot";
  const botUser = useMemo(
    () => ({
      _id: "chatbot",
      fullName: conversation?.name || "AI Assistant",
      avatarUrl: conversation?.avatarUrl,
      isOnline: true,
    }),
    [conversation?.avatarUrl, conversation?.name],
  );
  const isGroup =
    conversation?.type === "group" || conversation?.members?.length > 2;

  const isAnyMenuOpen = menuMessageId !== null || pinnedMenuId !== null;

  useEffect(() => {
    if (isBot) setSelectedBotTopic(DEFAULT_BOT_TOPIC);
  }, [conversationId, isBot]);

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
      setMessages((prev) =>
        prev.some((m) => m._id === saved._id) ? prev : [...prev, saved],
      );
      onNewMessage?.({ conversationId, message: saved, conversation });
    } catch (err) {
      console.error("Send message failed:", err?.response?.data || err);
      toast.error("Không thể gửi sticker");
    }
  };

  useEffect(() => {
    const getPartnerInfo = async () => {
      if (isBot) {
        setChatPartner(botUser);
        return;
      }
      if (!isGroup && conversation?.members) {
        const partnerId = conversation.members.find(
          (m) => m.userId?._id !== currentUserId,
        )?.userId?._id;
        if (partnerId) {
          try {
            const res = await userApi.getById(partnerId);
            setChatPartner(res.data.result || res.data);
          } catch (err) {
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
  }, [conversation, currentUserId, isBot, isGroup, botUser]);

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

  const forwardList = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return allConversations
      .map((c) => {
        const members = c.members || [];
        const otherUser = members.find(
          (m) => m.userId?._id !== currentUserId,
        )?.userId;
        const isBotChat = c.type === "bot";
        const isGroupChat = c.type === "group" || members.length > 2;
        const name = isBotChat
          ? c.name || "AI Assistant"
          : isGroupChat
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
    if (msg.sender?.fullName) return msg.sender;
    if (typeof msg.senderId === "object" && msg.senderId?.fullName) {
      return msg.senderId;
    }

    const senderId =
      msg.senderId && typeof msg.senderId === "object"
        ? msg.senderId._id
        : msg.senderId;
    const member = conversation?.members?.find((m) => {
      const memberId = m.userId?._id || m.userId;
      return String(memberId) === String(senderId);
    })?.userId;

    if (member) return member;
    if (isBot && String(senderId) !== String(currentUserId)) return botUser;
    return null;
  };

  const isAudioAttachment = (file) =>
    file?.type === "audio" ||
    file?.type === "voice" ||
    file?.mimeType?.startsWith("audio/") ||
    file?.mimetype?.startsWith("audio/") ||
    file?.fileName?.match(/\.(webm|mp3|m4a|wav|ogg)$/i);

  const getReplyPreviewText = (msg) => {
    if (!msg) return "";
    if (msg.isRecalled) return "Tin nhắn đã được thu hồi";
    if (msg.type === "sticker") return "[Sticker]";
    if (msg.type === "voice" || msg.type === "audio") return "[Tin nhan thoai]";
    const atts = msg.attachments || (msg.attachment ? [msg.attachment] : []);
    if (atts.length > 0 && !msg.content) {
      if (atts.every(isAudioAttachment)) return "[Tin nhan thoai]";
      if (atts.every((f) => f.type === "image")) return "[Hình ảnh]";
      return "[Tệp đính kèm]";
    }
    return msg.content || "";
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const showViolationMessage = (err, blockedContent) => {
    const result = err?.response?.data?.result || {};
    const warningText =
      result.message || "Tin nhắn chứa nội dung vi phạm quy tắc cộng đồng.";
    const localMessage = {
      _id: `violation-${Date.now()}`,
      conversationId,
      senderId: currentUserId,
      content: escapeHtml(blockedContent),
      type: "text",
      attachments: [],
      createdAt: new Date().toISOString(),
      isViolation: true,
      violationMessage: warningText,
    };

    setInput("");
    setFiles([]);
    setPreview([]);
    setReplyingMessage(null);
    setViolationModal({
      show: true,
      content: blockedContent,
      message: warningText,
    });
  };

  const buildSummaryPayload = () =>
    messages
      .filter((msg) => !msg.isDeleted && !msg.isRecalled)
      .map((msg) => {
        const sender =
          typeof msg.senderId === "object" ? msg.senderId : getSender(msg);

        return {
          _id: msg._id,
          senderId: {
            _id:
              typeof msg.senderId === "object"
                ? msg.senderId?._id
                : msg.senderId,
            fullName: sender?.fullName || "Unknown",
          },
          content: msg.content || "",
          createdAt: msg.createdAt,
          attachments:
            msg.attachments || (msg.attachment ? [msg.attachment] : []),
          isDeleted: Boolean(msg.isDeleted),
          isRecalled: Boolean(msg.isRecalled),
        };
      });

  const normalizeSummaryText = (data) => {
    const raw =
      data?.result?.summary ||
      data?.result?.content ||
      data?.result ||
      data?.summary ||
      data?.content ||
      data?.data?.summary ||
      data?.data;

    if (typeof raw === "string") return raw;
    if (Array.isArray(raw)) return raw.join("\n");
    if (raw && typeof raw === "object") {
      return raw.summary || raw.content || JSON.stringify(raw, null, 2);
    }
    return "";
  };

  const handleSummarizeMessages = async () => {
    const payload = buildSummaryPayload();
    setShowSummaryModal(true);
    setSummaryError("");

    if (payload.length === 0) {
      setSummaryText("");
      setSummaryError("Khong co tin nhan hop le de tom tat");
      return;
    }

    setIsSummarizing(true);
    try {
      const res = await messageApi.summarizeConversation(payload);
      const summary = normalizeSummaryText(res.data);
      setSummaryText(summary || "Khong co noi dung tom tat");
    } catch (err) {
      setSummaryText("");
      setSummaryError(
        err?.response?.data?.message || "Tom tat tin nhan that bai",
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  const scrollToMessage = (messageId) => {
    const id = typeof messageId === "object" ? messageId?._id : messageId;
    if (!id) return;
    const el = messageRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(id);
    setTimeout(
      () => setHighlightedMessageId((prev) => (prev === id ? null : prev)),
      3000,
    );
  };

  const jumpToSearchResult = async (msg) => {
    const messageId = msg?._id;
    if (!messageId) return;
    const el = messageRefs.current[messageId];
    if (el) {
      scrollToMessage(messageId);
      return;
    }
    let allMsgs = [...messages];
    let nextPage = page + 1;
    let found = false;
    while (!found) {
      try {
        const res = await messageApi.getMessages(conversationId, nextPage);
        const pageMsgs = res.data.result.data || [];
        if (pageMsgs.length === 0) break;
        const reversed = pageMsgs.reverse();
        allMsgs = [...reversed, ...allMsgs];
        found = reversed.some((m) => m._id === messageId);
        nextPage++;
      } catch {
        break;
      }
    }
    if (found) {
      setMessages(allMsgs);
      setPage(nextPage - 1);
      setTimeout(() => {
        const el = messageRefs.current[messageId];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setHighlightedMessageId(messageId);
          setTimeout(
            () =>
              setHighlightedMessageId((prev) =>
                prev === messageId ? null : prev,
              ),
            3000,
          );
        }
      }, 150);
    }
  };

  const loadMore = async () => {
    if (!conversationId || isLoadingMoreRef.current || !hasMore) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await messageApi.getMessages(conversationId, nextPage);
      const data = res.data.result.data || [];
      const newMsgs = data.reverse();
      if (newMsgs.length === 0) {
        setHasMore(false);
      } else {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const unique = newMsgs.filter((m) => !existingIds.has(m._id));
          return [...unique, ...prev];
        });
        setPage(nextPage);
        setHasMore(newMsgs.length >= 20);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  };

  const handlePinMessage = async (msg) => {
    try {
      await conversationApi.pinMessage({ conversationId, messageId: msg._id });
      const pinnedRes = await conversationApi.getPinnedMessages(conversationId);
      const newPinned = pinnedRes.data.result || [];
      setPinnedMessages(newPinned);
      const pinnedItem = newPinned.find((item) => {
        const pinnedMsg = item?.messageId || item;
        return String(pinnedMsg?._id) === String(msg._id);
      });
      const updatedMessage = pinnedItem?.messageId ||
        pinnedItem || { ...msg, isPinned: true, conversationId };
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
      const updatedMessage = { ...msg, isPinned: false, conversationId };
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(msg._id) ? { ...m, isPinned: false } : m,
        ),
      );
      if (newPinned.length <= 1) setShowAllPinned(false);
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
      toast.error("Bỏ ghim thất bại");
    }
  };

  const isPinnedMessage = (messageId) => {
    return pinnedMessages.some((item) => {
      const pinnedId = item?.messageId?._id || item?.messageId || item?._id;
      return pinnedId === messageId;
    });
  };

  const handleUnpinFromBar = async (pinnedMsg) => {
    const msg = pinnedMsg?.messageId || pinnedMsg;
    if (!msg?._id) return;
    await handleUnpinMessage(msg);
    setPinnedMenuId(null);
  };

  // ========================================================================================================================
  // 1. Reset logic khi chuyển người chat
  useEffect(() => {
    prevLastMessageIdRef.current = null;
  }, [conversationId]);

  // 2. FIX CUỘN CHUẨN ZALO: Bám sát đáy kể cả khi có hình ảnh đang load
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    // Nếu tin nhắn cuối thay đổi -> Kích hoạt cuộn
    if (lastMessage && lastMessage._id !== prevLastMessageIdRef.current) {
      const isInitialLoad = prevLastMessageIdRef.current === null;
      prevLastMessageIdRef.current = lastMessage._id;

      const performScroll = () => {
        bottomRef.current?.scrollIntoView({
          behavior: isInitialLoad ? "auto" : "smooth",
          block: "end",
        });
      };

      // Thực hiện cuộn 3 nhịp:
      // Nhịp 1: Cuộn ngay lập tức cho text
      performScroll();
      // Nhịp 2 & 3: Đề phòng hình ảnh có dung lượng lớn load xong làm phình chiều cao
      setTimeout(performScroll, 100);
      setTimeout(performScroll, 300);
    }
  }, [messages]);
  // ========================================================================================================================

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideMessageMenu =
        messageMenuRef.current && messageMenuRef.current.contains(e.target);
      const clickedInsidePinnedMenu =
        pinnedMenuRef.current && pinnedMenuRef.current.contains(e.target);
      const clickedInsidePinnedDropdown =
        pinnedDropdownRef.current &&
        pinnedDropdownRef.current.contains(e.target);
      if (!clickedInsideMessageMenu) setMenuMessageId(null);
      if (!clickedInsidePinnedMenu) setPinnedMenuId(null);
      if (!clickedInsidePinnedDropdown) setShowAllPinned(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    setShowAllPinned(false);
    setPinnedMenuId(null);
    setPage(1);
    setHasMore(true);
    setMessages([]); // Xóa màn hình ngay lập tức khi đổi chat để chống chớp giật

    messageApi
      .getMessages(conversationId, 1)
      .then((res) => {
        const data = res.data.result.data || [];
        setMessages(data.reverse());
        setHasMore(data.length >= 20);
      })
      .catch(console.error);

    conversationApi
      .getPinnedMessages(conversationId)
      .then((res) => setPinnedMessages(res.data.result || []))
      .catch(console.error);

    socket.emit("join_conversation", conversationId);

    const getConvId = (msg) => msg?.conversationId?._id || msg?.conversationId;

    const handleReceivePrivate = (data) => {
      const msg = data.message;
      if (!msg || !msg._id) return;
      if (getConvId(msg) && String(getConvId(msg)) !== String(conversationId))
        return;
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
      );
    };

    const handleReceiveGroup = (data) => {
      const msg = data.message;
      if (!msg || !msg._id) return;
      if (String(data.groupId || getConvId(msg)) !== String(conversationId))
        return;
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

    const handleNewMessage = (msg) => {
      if (!msg || !msg._id) return;
      if (getConvId(msg) && String(getConvId(msg)) !== String(conversationId))
        return;
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
      );
    };

    socket.on("receive_message", handleReceivePrivate);
    socket.on("receive_group_message", handleReceiveGroup);
    socket.on("new_message", handleNewMessage);
    socket.on("message_recalled", handleRecalled);
    socket.on("message_updated", handleMessageUpdated);

    return () => {
      socket.emit("leave_conversation", conversationId);
      socket.off("receive_message", handleReceivePrivate);
      socket.off("receive_group_message", handleReceiveGroup);
      socket.off("new_message", handleNewMessage);
      socket.off("message_recalled", handleRecalled);
      socket.off("message_updated", handleMessageUpdated);
    };
  }, [conversationId]);

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
      if (newPinned.length <= 1) setShowAllPinned(false);
    };

    socket.on("message_pinned", handlePinned);
    socket.on("message_unpinned", handleUnpinned);
    return () => {
      socket.off("message_pinned", handlePinned);
      socket.off("message_unpinned", handleUnpinned);
    };
  }, [conversationId]);

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
    return () => socket.off("message_reacted", handleMessageReacted);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    const handleGroupDisbanded = ({ conversationId: convId, message }) => {
      if (String(convId) !== String(conversationId)) return;
      toast.error(message || "Nhóm đã được giải tán");
      onCloseConversation?.(convId);
    };
    const handleRemovedFromGroup = ({ conversationId: convId, message }) => {
      if (String(convId) !== String(conversationId)) return;
      toast.error(message || "Bạn đã bị mời ra khỏi nhóm");
      onCloseConversation?.(convId);
    };
    socket.on("group_disbanded", handleGroupDisbanded);
    socket.on("removed_from_group", handleRemovedFromGroup);
    return () => {
      socket.off("group_disbanded", handleGroupDisbanded);
      socket.off("removed_from_group", handleRemovedFromGroup);
    };
  }, [conversationId, onCloseConversation]);

  const handleSend = async () => {
    if (!conversationId || (!input.trim() && files.length === 0)) return;
    const formData = new FormData();
    formData.append("conversationId", conversationId);
    formData.append("content", input);
    formData.append("senderId", currentUserId);
    if (replyingMessage?._id)
      formData.append("replyToMessageId", replyingMessage._id);
    files.forEach((file) => formData.append("files", file));

    try {
      if (conversation?.type === "bot") {
        const payload = {
          conversationId,
          content: input,
          topic: selectedBotTopic || DEFAULT_BOT_TOPIC,
        };
        const res = await messageApi.sendChatbotMessage(payload);
        const { userMessage, botMessage } = res.data.result;
        setMessages((prev) => {
          let next = prev;
          if (userMessage && !next.some((m) => m._id === userMessage._id)) {
            next = [...next, userMessage];
          }
          if (botMessage && !next.some((m) => m._id === botMessage._id)) {
            next = [...next, botMessage];
          }
          return next;
        });
        onNewMessage?.({ conversationId, message: botMessage, conversation });
      } else {
        const res = await messageApi.sendMessage(formData);
        if (res.data.code === 1000) {
          const saved = res.data.result;
          setMessages((prev) =>
            prev.some((m) => m._id === saved._id) ? prev : [...prev, saved],
          );
          onNewMessage?.({ conversationId, message: saved, conversation });
        }
      }
      setInput("");
      setFiles([]);
      setPreview([]);
      setReplyingMessage(null);
    } catch (err) {
      console.error("Send message failed:", err?.response?.data || err);

      if (err?.response?.data?.code === 4001) {
        showViolationMessage(err, input.trim());
        return;
      }

      if (conversation?.type === "bot") {
        try {
          const latestRes = await messageApi.getMessages(conversationId, 1);
          const latestMessages = latestRes.data.result.data || [];
          const orderedMessages = latestMessages.reverse();
          const sentMessage = orderedMessages.find(
            (msg) =>
              String(msg.senderId?._id || msg.senderId) ===
                String(currentUserId) && msg.content === input.trim(),
          );

          setMessages(orderedMessages);
          setPage(1);
          setHasMore(latestMessages.length >= 20);

          if (sentMessage) {
            onNewMessage?.({
              conversationId,
              message: sentMessage,
              conversation,
            });
            setInput("");
            setFiles([]);
            setPreview([]);
            setReplyingMessage(null);
            toast.error(
              "Chatbot đang gặp lỗi, nhưng tin nhắn của bạn đã được gửi",
            );
            return;
          }
        } catch (refreshError) {
          console.error(
            "Refresh messages after chatbot error failed:",
            refreshError,
          );
        }
      }

      toast.error("Gửi tin nhắn thất bại");
    }
  };

  const handleSendVoice = async (voiceFile) => {
    if (!conversationId || !voiceFile) return;
    if (conversation?.type === "bot") {
      toast.error("Chatbot chua ho tro tin nhan thoai");
      return;
    }

    const formData = new FormData();
    formData.append("conversationId", conversationId);
    formData.append("content", "");
    formData.append("senderId", currentUserId);
    if (replyingMessage?._id)
      formData.append("replyToMessageId", replyingMessage._id);
    formData.append("files", voiceFile);

    try {
      const res = await messageApi.sendMessage(formData);
      const saved = res.data.result;
      setMessages((prev) =>
        prev.some((m) => m._id === saved._id) ? prev : [...prev, saved],
      );
      onNewMessage?.({ conversationId, message: saved, conversation });
      setReplyingMessage(null);
    } catch (err) {
      toast.error("Gui tin nhan thoai that bai");
    }
  };

  const handleReactMessage = async (msg, emoji) => {
    try {
      const res = await messageApi.reactMessage({ messageId: msg._id, emoji });
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
        onMessageRecalled?.({ conversationId, messageId: msg._id });
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
          if (recipient)
            socket.emit("recall_message", {
              type: "direct",
              toUserId: recipient,
              conversationId,
              messageId: msg._id,
            });
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
    if (type === "reply") setReplyingMessage(msg);
    else if (type === "pin") {
      if (isPinnedMessage(msg._id)) await handleUnpinMessage(msg);
      else await handlePinMessage(msg);
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
    if (!targetConversation)
      return toast.error("Không tìm thấy cuộc trò chuyện");

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
      onNewMessage?.({
        conversationId: targetConvId,
        message: saved,
        conversation: targetConversation,
      });
      setForwardModal(false);
      setForwardContent(null);
      toast.success("Chuyển tiếp thành công!");
    } catch (err) {
      toast.error("Lỗi khi chuyển tiếp");
    }
  };

  const updateActionSide = (messageId, bubbleEl) => {
    if (!bubbleEl) return;
    const rect = bubbleEl.getBoundingClientRect();
    const actionWidth = 170;
    const gap = 12;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;
    let side = "right-side";
    if (spaceRight < actionWidth + gap && spaceLeft > spaceRight)
      side = "left-side";
    if (spaceLeft < actionWidth + gap && spaceRight >= spaceLeft)
      side = "right-side";
    setActionSideMap((prev) =>
      prev[messageId] === side ? prev : { ...prev, [messageId]: side },
    );
  };

  const getVerticalPosition = (el) => {
    if (!el) return "bottom";
    const rect = el.getBoundingClientRect();
    const spaceTop = rect.top;
    const spaceBottom = window.innerHeight - rect.bottom;
    if (spaceBottom < 120 && spaceTop > spaceBottom) return "top";
    return "bottom";
  };

  return (
    <div className="modern-chat-container">
      <ChatHeader
        isGroup={isGroup}
        isBot={isBot}
        conversation={conversation}
        chatPartner={chatPartner}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenSummary={handleSummarizeMessages}
        onOpenMedia={() => setShowMediaGallery(true)}
        botTopic={selectedBotTopic}
        setBotTopic={setSelectedBotTopic}
        botTopicOptions={BOT_TOPIC_OPTIONS}
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
        setMessageRef={(id, el) => {
          messageRefs.current[id] = el;
        }}
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
        loadMore={loadMore}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
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
        handleSendVoice={handleSendVoice}
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

      <SearchModal
        show={showSearchModal}
        onHide={() => setShowSearchModal(false)}
        conversationId={conversationId}
        onJumpToMessage={jumpToSearchResult}
        conversation={conversation}
      />

      <SummaryModal
        show={showSummaryModal}
        onHide={() => setShowSummaryModal(false)}
        summary={summaryText}
        loading={isSummarizing}
        error={summaryError}
        messageCount={buildSummaryPayload().length}
        onSummarize={handleSummarizeMessages}
      />

      <ViolationWarningModal
        show={violationModal.show}
        content={violationModal.content}
        message={violationModal.message}
        onHide={() =>
          setViolationModal({ show: false, content: "", message: "" })
        }
      />

      <MediaGallery
        show={showMediaGallery}
        onHide={() => setShowMediaGallery(false)}
        conversationId={conversationId}
      />
    </div>
  );
}

export default ChatMain;
