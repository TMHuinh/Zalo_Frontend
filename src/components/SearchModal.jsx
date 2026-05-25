import { useState, useRef, useEffect } from "react";
import { HiSearch, HiX } from "react-icons/hi";
import messageApi from "../api/messageApi";
const formatTimeAgo = (date) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

function SearchModal({ show, onHide, conversationId, onJumpToMessage, conversation }) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (show) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setKeyword("");
      setResults([]);
    }
  }, [show]);

  const getSenderName = (msg) => {
    if (msg.sender?.fullName) return msg.sender.fullName;
    const senderId = typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
    if (senderId && conversation?.members) {
      const member = conversation.members.find((m) => {
        const id = m.userId?._id || m.userId;
        return String(id) === String(senderId);
      });
      if (member?.userId?.fullName) return member.userId.fullName;
    }
    return "Unknown";
  };

  const getSenderAvatar = (msg) => {
    if (msg.sender?.avatarUrl) return msg.sender.avatarUrl;
    const senderId = typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
    if (senderId && conversation?.members) {
      const member = conversation.members.find((m) => {
        const id = m.userId?._id || m.userId;
        return String(id) === String(senderId);
      });
      if (member?.userId?.avatarUrl) return member.userId.avatarUrl;
    }
    return null;
  };

  const handleSearch = async () => {
    const q = keyword.trim();
    if (!q || !conversationId) return;
    setLoading(true);
    try {
      const res = await messageApi.searchMessages(conversationId, q);
      const raw = res.data.data?.data || res.data.data || res.data.result?.data || res.data.result;
      setResults(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleJump = (msg) => {
    onJumpToMessage?.(msg);
    onHide();
  };

  const highlightText = (text, q) => {
    if (!q || !text) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ background: "#fff3a8", padding: "0 2px", borderRadius: 2 }}>
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  if (!show) return null;

  return (
    <div className="search-modal-overlay" onClick={onHide}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <h4>Tìm kiếm tin nhắn</h4>
          <button className="search-modal-close" onClick={onHide}>
            <HiX size={20} />
          </button>
        </div>

        <div className="search-modal-input-wrap">
          <HiSearch size={18} color="#72808e" />
          <input
            ref={inputRef}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập từ khóa tìm kiếm..."
            className="search-modal-input"
          />
          {keyword && (
            <button className="search-modal-clear" onClick={() => { setKeyword(""); setResults([]); }}>
              <HiX size={16} />
            </button>
          )}
          <button className="search-modal-submit" onClick={handleSearch} disabled={loading || !keyword.trim()}>
            Tìm
          </button>
        </div>

        <div className="search-modal-body">
          {loading && <div className="search-modal-loading">Đang tìm kiếm...</div>}

          {!loading && results.length === 0 && keyword && (
            <div className="search-modal-empty">Không tìm thấy kết quả</div>
          )}

          {!loading && results.length > 0 && (
            <div className="search-modal-results">
              {results.map((msg) => (
                <div
                  key={msg._id}
                  className="search-result-item"
                  onClick={() => handleJump(msg)}
                >
                  <div className="search-result-sender">
                    {getSenderAvatar(msg) ? (
                      <img src={getSenderAvatar(msg)} alt="" className="search-result-avatar" />
                    ) : (
                      <div className="search-result-avatar-text">
                        {getSenderName(msg).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="search-result-sender-info">
                      <span className="search-result-sender-name">
                        {getSenderName(msg)}
                      </span>
                      <span className="search-result-time">
                        {formatTimeAgo(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="search-result-content">
                    {msg.content && (
                      <span className="search-result-text">
                        {highlightText(msg.content, keyword)}
                      </span>
                    )}
                    {!msg.content && msg.attachment && (
                      <span className="search-result-attach">
                        {msg.attachment.type === "image" ? "[Hình ảnh]" : "[Tệp đính kèm]"}
                      </span>
                    )}
                    {!msg.content && msg.attachments?.length > 0 && (
                      <span className="search-result-attach">
                        {msg.attachments.every((f) => f.type === "image")
                          ? "[Hình ảnh]"
                          : "[Tệp đính kèm]"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !keyword && (
            <div className="search-modal-hint">
              Gõ từ khóa và nhấn Enter để tìm kiếm trong cuộc trò chuyện này
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
