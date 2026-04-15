import { useEffect, useState, useRef, useMemo } from "react";
import socket from "../socket/socket";
import messageApi from "../api/messageApi";
import conversationApi from "../api/conversationApi";
import userApi from "../api/userApi";
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
} from "react-icons/fi";
import { Modal, Button, ListGroup, Image } from "react-bootstrap";
import toast, { Toaster } from "react-hot-toast";
import "../css/chatMain.css";

function ChatMain({ currentUserId, conversation, onNewMessage }) {
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

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: "",
    msg: null,
  });

  const bottomRef = useRef(null);
  const conversationId = conversation?._id;
  const isGroup =
    conversation?.type === "group" || conversation?.members?.length > 2;

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
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FF33A1", "#33FFF6", "#FF8333", "#8D33FF", "#33FF8A", "#FF3333", "#00A8FF", "#9C27B0", "#4CAF50", "#E91E63", "#FF9800", "#009688", "#673AB7", "#FFC107", "#795548", "#607D8B"];
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;
    messageApi
      .getMessages(conversationId)
      .then((res) => setMessages(res.data.result.data.reverse()))
      .catch(console.error);
    socket.emit("join_conversation", conversationId);

    const handleReceive = (data) => {
      let msg =
        typeof data.message === "string"
          ? JSON.parse(data.message)
          : data.message;
      if (!msg || !msg._id || data.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
      );
    };
    const handleRecalled = ({ messageId }) =>
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isRecalled: true } : m)),
      );

    socket.on("receive_message", handleReceive);
    socket.on("message_recalled", handleRecalled);

    return () => {
      socket.emit("leave_conversation", conversationId);
      socket.off("receive_message", handleReceive);
      socket.off("message_recalled", handleRecalled);
    };
  }, [conversationId]);

  const handleSend = async () => {
    if (!conversationId || (!input.trim() && files.length === 0)) return;
    const formData = new FormData();
    formData.append("conversationId", conversationId);
    formData.append("senderId", currentUserId);
    formData.append("content", input);
    files.forEach((file) => formData.append("files", file));
    try {
      const res = await messageApi.sendMessage(formData);
      const saved = res.data.result;
      setMessages((prev) => [...prev, saved]);
      const recipients = conversation.members
        .filter((m) => m.userId._id !== currentUserId)
        .map((m) => m.userId._id);
      socket.emit("send_message", {
        userId: currentUserId,
        toUserId: recipients,
        conversationId,
        message: JSON.stringify(saved),
      });
      onNewMessage?.({ conversationId, message: saved });
      setInput("");
      setFiles([]);
      setPreview([]);
    } catch (err) {
      toast.error("Gửi tin nhắn thất bại");
    }
  };

  const executeAction = async () => {
    const { type, msg } = confirmModal;
    try {
      if (type === "revoke") {
        const res = await messageApi.revokeMessage(msg._id);
        const updatedMsg = res.data.result || res.data;
        setMessages((prev) =>
          prev.map((m) =>
            m._id === updatedMsg._id ? updatedMsg : m,
          ),
        );
        const recipients = conversation.members
          .filter((m) => m.userId?._id !== currentUserId)
          .map((m) => m.userId._id);
        socket.emit("recall_message", {
          toUserId: recipients,
          messageId: msg._id,
        });
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

  const handleActionClick = (msg, type) => {
    if (type === "forward") {
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
        attachments: forwardContent.attachments || []
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
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
              </div>
            ) : chatPartner?.avatarUrl ? (
              <img src={chatPartner.avatarUrl} alt="" className="main-avatar" />
            ) : (
              <div className="text-avatar">
                {chatPartner?.fullName?.charAt(0)}
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
                ? conversation.name || "Nhóm hội"
                : chatPartner?.fullName}
            </h3>
            <span
              className={`user-status-text ${chatPartner?.isOnline ? "online" : "offline"}`}
            >
              {isGroup
                ? `${conversation.members.length} thành viên`
                : chatPartner?.isOnline
                  ? "Đang hoạt động"
                  : "Offline"}
            </span>
          </div>
        </div>
      </div>

      <div className="chat-body-modern">
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
          const isOnlyImage =
            !msg.isRecalled && 
            !msg.content &&
            msg.attachments?.length > 0 &&
            msg.attachments.every((f) => f.type === "image");

          return (
            <div
              key={msg._id}
              className={`message-row-modern ${isMe ? "me" : "other"} ${isLastOfBlock ? "margin-block" : ""}`}
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
                      isOnlyImage
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
                        {msg.content && (
                          <p className="msg-text">{msg.content}</p>
                        )}
                        {msg.attachments?.map((file, i) => (
                          <div key={i} className="attachment-modern">
                            {file.type === "image" ? (
                              <img
                                src={file.url}
                                alt=""
                                className="msg-img-modern"
                                style={
                                  isOnlyImage && i === 0 ? { marginTop: 0 } : {}
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
                        <div className="msg-meta-zalo">
                          <span
                            className="timestamp-zalo"
                            style={
                              isOnlyImage
                                ? {
                                    color: "#72808e",
                                    padding: "2px 4px",
                                    textShadow:
                                      "0 1px 2px rgba(255,255,255,0.8)",
                                  }
                                : {}
                            }
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                    {!msg.isRecalled && (
                      <div className="message-actions-trigger">
                        <FiMoreHorizontal
                          onClick={() =>
                            setMenuMessageId(
                              menuMessageId === msg._id ? null : msg._id,
                            )
                          }
                        />
                        {menuMessageId === msg._id && (
                          <div className="action-menu-dropdown">
                            {isMe && (
                              <button
                                className="menu-item"
                                onClick={() => handleActionClick(msg, "revoke")}
                              >
                                Thu hồi
                              </button>
                            )}
                            <button
                              className="menu-item"
                              onClick={() => handleActionClick(msg, "forward")}
                            >
                              Chuyển tiếp
                            </button>
                            <button
                              className="menu-item delete"
                              onClick={() => handleActionClick(msg, "delete")}
                            >
                              Xóa phía tôi
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
            <button className="btn-emoji-refined">
              <FiSmile />
            </button>
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