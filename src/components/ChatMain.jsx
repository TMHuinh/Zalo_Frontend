import { useEffect, useState, useRef } from "react";
import socket from "../socket/socket";
import "../css/chatMain.css";
import messageApi from "../api/messageApi";
import { FiPaperclip } from "react-icons/fi";

function ChatMain({ currentUserId, conversation, onNewMessage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);

  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [menuMessageId, setMenuMessageId] = useState(null);

  const bottomRef = useRef(null);
  const conversationId = conversation?._id;

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================
  // LOAD MESSAGES
  // =========================
  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;

      try {
        const res = await messageApi.getMessages(conversationId);
        setMessages(res.data.result.data.reverse());
      } catch (err) {
        console.log(err);
      }
    };

    fetchMessages();
  }, [conversationId]);

  // =========================
  // JOIN ROOM
  // =========================
  useEffect(() => {
    if (!conversationId) return;

    socket.emit("join_conversation", conversationId);

    return () => {
      socket.emit("leave_conversation", conversationId);
    };
  }, [conversationId]);

  // =========================
  // RECEIVE NEW MESSAGE
  // =========================
  useEffect(() => {
    const handleReceive = async () => {
      if (!conversationId) return;

      try {
        const res = await messageApi.getMessages(conversationId, 1, 1);
        const latest = res.data.result.data[0];

        setMessages((prev) => {
          if (prev.some((m) => m._id === latest._id)) return prev;
          return [...prev, latest];
        });
      } catch (err) {
        console.log(err);
      }
    };

    socket.on("receive_message", handleReceive);

    return () => socket.off("receive_message", handleReceive);
  }, [conversationId]);

  // =========================
  // HANDLE RECALL / DELETE REALTIME
  // =========================
  useEffect(() => {
    const handleRecalled = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isRecalled: true } : m)),
      );
    };

    const handleDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true } : m)),
      );
    };

    socket.on("message_recalled", handleRecalled);
    socket.on("message_deleted", handleDeleted);

    return () => {
      socket.off("message_recalled", handleRecalled);
      socket.off("message_deleted", handleDeleted);
    };
  }, []);

  // =========================
  // FILE HANDLER
  // =========================
  const handleSelectFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setPreview(selected.map((f) => URL.createObjectURL(f)));
  };

  // =========================
  // SEND MESSAGE
  // =========================
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

      const otherUser = conversation.members.find(
        (m) => m.userId._id !== currentUserId,
      );

      const payload = {
        userId: currentUserId,
        toUserId: otherUser?.userId?._id,
        conversationId,
        message: saved.content || "[file]",
      };

      socket.emit("send_message", payload);

      // 🔥 QUAN TRỌNG: update ChatList ngay lập tức
      onNewMessage?.({
        conversationId,
        message: saved,
      });

      setInput("");
      setFiles([]);
      setPreview([]);
    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // REVOKE / DELETE
  // =========================
  const handleAction = async (msg, type) => {
    const actionText = type === "revoke" ? "thu hồi" : "xoá";

    const ok = window.confirm(
      `Bạn có chắc muốn ${actionText} tin nhắn này không?`,
    );

    if (!ok) return;

    try {
      let res;

      if (type === "revoke") {
        res = await messageApi.revokeMessage(msg._id);
      } else {
        res = await messageApi.deleteMessage(msg._id);
      }

      const updated = res.data.result;

      setMessages((prev) =>
        prev.map((m) => (m._id === updated._id ? updated : m)),
      );

      const otherUser = conversation.members.find(
        (m) => m.userId._id !== currentUserId,
      );

      if (type === "revoke") {
        socket.emit("recall_message", {
          toUserId: otherUser.userId._id,
          messageId: msg._id,
        });
      } else {
        socket.emit("delete_message", {
          toUserId: otherUser.userId._id,
          messageId: msg._id,
        });
      }

      setMenuMessageId(null);
    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // CLICK OUTSIDE MENU
  // =========================
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuMessageId(null);
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // =========================
  // RENDER MESSAGE
  // =========================
  const renderMessage = (msg) => {
    if (msg.isDeleted) return <i>🗑 Tin nhắn đã bị xoá</i>;
    if (msg.isRecalled)
      return <i style={{ opacity: 0.6 }}>🚫 Tin nhắn đã được thu hồi</i>;

    return (
      <>
        {msg.content && <div>{msg.content}</div>}

        {msg.attachments?.map((file, i) => {
          if (file.type === "image") {
            return <img key={i} src={file.url} alt="" className="chat-image" />;
          }

          return (
            <div
              key={i}
              className="file-box"
              onClick={() => window.open(file.url, "_blank")}
            >
              📄 {file.fileName}
            </div>
          );
        })}
      </>
    );
  };

  const otherUser = conversation?.members?.find(
    (m) => m.userId._id !== currentUserId,
  );

  // =========================
  // UI
  // =========================
  return (
    <div className="chat-container-main">
      {/* HEADER */}
      <div className="chat-header">
        {otherUser ? (
          <div className="chat-header-info">
            <div className="avatar">
              {otherUser.userId.avatarUrl ? (
                <img src={otherUser.userId.avatarUrl} />
              ) : (
                <span>{otherUser.userId.fullName?.charAt(0)}</span>
              )}
            </div>
            <div className="name">{otherUser.userId.fullName}</div>
          </div>
        ) : (
          <h3>Chọn cuộc trò chuyện</h3>
        )}
      </div>

      {/* BODY */}
      <div className="chat-body">
        {messages.map((msg, index) => {
          const senderId =
            typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;

          const isMe = senderId === currentUserId;

          return (
            <div
              key={msg._id || index}
              className={`chat-bubble ${isMe ? "me" : "other"}`}
              onMouseEnter={() => setHoveredMessageId(msg._id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              {isMe && hoveredMessageId === msg._id && (
                <div
                  className="msg-dots"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuMessageId(
                      menuMessageId === msg._id ? null : msg._id,
                    );
                  }}
                >
                  ⋯
                </div>
              )}

              {menuMessageId === msg._id && isMe && (
                <div className="msg-menu">
                  <button onClick={() => handleAction(msg, "revoke")}>
                    Thu hồi
                  </button>
                  <button onClick={() => handleAction(msg, "delete")}>
                    Xoá
                  </button>
                </div>
              )}

              {renderMessage(msg)}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* PREVIEW */}
      {preview.length > 0 && (
        <div className="preview-container">
          {preview.map((url, i) => (
            <img key={i} src={url} className="preview-img" />
          ))}
        </div>
      )}

      {/* FOOTER */}
      {conversation && (
        <div className="chat-footer">
          <input
            type="file"
            multiple
            hidden
            id="fileInput"
            onChange={handleSelectFiles}
          />

          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            className="btn-icon"
            onClick={() => document.getElementById("fileInput").click()}
          >
            <FiPaperclip />
          </button>

          <button onClick={handleSend}>Gửi</button>
        </div>
      )}
    </div>
  );
}

export default ChatMain;
