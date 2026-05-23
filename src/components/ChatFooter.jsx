import StickerPicker from "./StickerPicker";
import { FiPlusCircle, FiImage, FiSend } from "react-icons/fi";

function ChatFooter({
  input,
  setInput,
  files,
  setFiles,
  preview,
  setPreview,
  replyingMessage,
  setReplyingMessage,
  handleSend,
  handleSendSticker,
  getSender,
  currentUserId,
  getReplyPreviewText,
}) {
  return (
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
  );
}

export default ChatFooter;
