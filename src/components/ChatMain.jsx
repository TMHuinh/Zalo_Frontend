import { useEffect, useState, useRef } from "react";
import socket from "../socket/socket";
import "../css/chatMain.css";
import messageApi from "../api/messageApi";
import { FiPaperclip } from "react-icons/fi";

function ChatMain({ currentUserId, conversation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  const conversationId = conversation?._id;

  // =========================
  // AUTO SCROLL
  // =========================
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (conversation?._id && setIsTyping) {
      setIsTyping(true);
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // =========================
  // LOAD MESSAGE
  // =========================
  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;

      try {
        const res = await messageApi.getMessages(conversationId);
        setMessages(res.data.result.data.reverse());
      } catch (err) {
        console.log("Load messages error:", err);
      }
    };

    fetchMessages();
  }, [conversationId]);

  // =========================
  // RECEIVE MESSAGE (REALTIME)
  // =========================
  useEffect(() => {
    const handleReceive = async () => {
      if (!conversationId) return;

      try {
        // chỉ lấy message mới nhất
        const res = await messageApi.getMessages(conversationId, 1, 1);
        const latest = res.data.result.data[0];

        setMessages((prev) => {
          // tránh duplicate
          if (prev.find((m) => m._id === latest._id)) return prev;
          return [...prev, latest];
        });
      } catch (err) {
        console.log("Reload message error:", err);
      }
    };

    socket.on("receive_message", handleReceive);

    return () => socket.off("receive_message", handleReceive);
  }, [conversationId]);

  // =========================
  // SELECT FILE
  // =========================
  const handleSelectFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);

    const previewUrls = selected.map((file) => URL.createObjectURL(file));
    setPreview(previewUrls);
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

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await messageApi.sendMessage(formData);
      const savedMessage = res.data.result;

      // 👉 HIỂN THỊ NGAY (KHÔNG CHỜ SOCKET)
      setMessages((prev) => [...prev, savedMessage]);

      // 🔥 SOCKET trigger bên kia reload
      const otherUser = conversation.members.find(
        (m) => m.userId._id !== currentUserId,
      );

      socket.emit("send_message", {
        userId: currentUserId,
        toUserId: otherUser?.userId?._id,
        message: input || "[file]",
      });

      setInput("");
      setFiles([]);
      setPreview([]);
    } catch (err) {
      console.log("Send message error:", err);
    }
  };

  // =========================
  // UI
  // =========================
  const otherUser = conversation?.members?.find(
    (m) => m.userId._id !== currentUserId,
  );

  return (
    <div className="chat-container-main">
      {/* HEADER */}
      <div className="chat-header">
        {otherUser ? (
          <div className="chat-header-info">
            <div className="avatar">
              {otherUser.userId.avatarUrl ? (
                <img
                  src={otherUser.userId.avatarUrl}
                  alt={otherUser.userId.fullName}
                />
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

      {/* MESSAGE LIST */}
      <div className="chat-body">
        {messages.map((msg, index) => {
          const senderId =
            typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;

          const isMe = senderId === currentUserId;

          return (
            <div
              key={msg._id || index}
              className={`chat-bubble ${isMe ? "me" : "other"}`}
            >
              {/* TEXT */}
              {msg.content && <div>{msg.content}</div>}

              {/* FILE */}
              {msg.attachments?.map((file, i) => {
                // 🖼️ IMAGE
                if (file.type === "image") {
                  return (
                    <img key={i} src={file.url} alt="" className="chat-image" />
                  );
                }

                // 📄 FILE
                return (
                  <div
                    key={i}
                    className="file-box"
                    onClick={() => window.open(file.url, "_blank")}
                  >
                    <div className="file-icon">📄</div>

                    <div className="file-info">
                      <div className="file-name">{file.fileName || "File"}</div>
                      <div className="file-action">Nhấn để tải</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>

      {/* PREVIEW */}
      {preview.length > 0 && (
        <div className="preview-container">
          {preview.map((url, i) => (
            <img key={i} src={url} className="preview-img" />
          ))}
        </div>
      )}

      {/* INPUT */}
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
            onFocus={() => setIsTyping(true)}
            onBlur={() => setIsTyping(false)}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Nhập tin nhắn..."
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
