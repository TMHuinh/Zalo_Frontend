import StickerPicker from "./StickerPicker";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FiArchive,
  FiFile,
  FiFileText,
  FiImage,
  FiMic,
  FiMusic,
  FiPlusCircle,
  FiSend,
  FiStopCircle,
  FiX,
} from "react-icons/fi";

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
  handleSendVoice,
  handleSendSticker,
  getSender,
  currentUserId,
  getReplyPreviewText,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const discardRecordingRef = useRef(false);
  const fileInputRef = useRef(null);
  const previewRef = useRef([]);

  const getFileName = (file) => file?.name || file?.fileName || "Tep dinh kem";

  const getFileExtension = (file) => {
    const name = getFileName(file);
    const ext = name.includes(".") ? name.split(".").pop() : "";
    return ext ? ext.toUpperCase() : "FILE";
  };

  const formatFileSize = (size) => {
    const value = Number(size);
    if (!Number.isFinite(value) || value <= 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let result = value;
    let unitIndex = 0;

    while (result >= 1024 && unitIndex < units.length - 1) {
      result /= 1024;
      unitIndex += 1;
    }

    return `${result >= 10 || unitIndex === 0 ? result.toFixed(0) : result.toFixed(1)} ${units[unitIndex]}`;
  };

  const isImageFile = (file) => file?.type?.startsWith("image/");
  const isAudioFile = (file) => file?.type?.startsWith("audio/");

  const getPreviewIcon = (file) => {
    const ext = getFileExtension(file).toLowerCase();
    if (isImageFile(file)) return <FiImage />;
    if (isAudioFile(file)) return <FiMusic />;
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return <FiArchive />;
    if (
      ["txt", "doc", "docx", "pdf", "xls", "xlsx", "ppt", "pptx"].includes(ext)
    ) {
      return <FiFileText />;
    }
    return <FiFile />;
  };

  const removePreviewAt = (index) => {
    const removed = preview[index];
    if (removed?.url) URL.revokeObjectURL(removed.url);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const stopTracks = () => {
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
  };

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error("Trinh duyet khong ho tro ghi am");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });

      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      discardRecordingRef.current = false;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const chunks = audioChunksRef.current;
        stopTracks();
        setIsRecording(false);

        if (discardRecordingRef.current) {
          audioChunksRef.current = [];
          mediaRecorderRef.current = null;
          discardRecordingRef.current = false;
          return;
        }

        if (chunks.length === 0) {
          toast.error("Khong ghi duoc am thanh");
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        const file = new File([blob], `voice-message-${Date.now()}.webm`, {
          type: mimeType,
        });

        try {
          setIsSendingVoice(true);
          await handleSendVoice(file);
        } finally {
          setIsSendingVoice(false);
          audioChunksRef.current = [];
          mediaRecorderRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      stopTracks();
      setIsRecording(false);
      toast.error("Khong the truy cap micro");
    }
  };

  const toggleVoiceRecording = () => {
    if (isSendingVoice) return;
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    startVoiceRecording();
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        discardRecordingRef.current = true;
        mediaRecorderRef.current.stop();
      }
      stopTracks();
    };
  }, []);

  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  useEffect(() => {
    return () => {
      previewRef.current.forEach((item) => {
        if (item?.url) URL.revokeObjectURL(item.url);
      });
    };
  }, []);

  return (
    <div className="chat-footer-modern">
      {preview.length > 0 && (
        <div className="preview-bar-modern">
          <div className="preview-bar-header">
            <span>File đính kèm</span>
            <strong>{preview.length}</strong>
          </div>
          <div className="preview-file-list">
            {preview.map((item, i) => (
              <div key={`${item.name}-${i}`} className="preview-file-card">
                {item.isImage ? (
                  <img
                    className="preview-file-thumb"
                    src={item.url}
                    alt={item.name}
                  />
                ) : (
                  <div className="preview-file-icon">{getPreviewIcon(item)}</div>
                )}

                <div className="preview-file-info">
                  <span className="preview-file-name">{item.name}</span>
                  <span className="preview-file-meta">
                    {getFileExtension(item)}
                    {item.size ? ` • ${formatFileSize(item.size)}` : ""}
                  </span>
                </div>

                <button
                  type="button"
                  className="preview-file-remove"
                  title="Bỏ file"
                  onClick={() => removePreviewAt(i)}
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {false && preview.length > 0 && (
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
                  replyingMessage.senderId &&
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
            ref={fileInputRef}
            type="file"
            id="f-upload-modern"
            hidden
            multiple
            onChange={(e) => {
              const selected = Array.from(e.target.files);
              if (selected.length === 0) return;
              previewRef.current.forEach((item) => {
                if (item?.url) URL.revokeObjectURL(item.url);
              });
              setFiles(selected);
              setPreview(
                selected.map((file) => ({
                  url: URL.createObjectURL(file),
                  name: getFileName(file),
                  size: file.size,
                  type: file.type,
                  isImage: isImageFile(file),
                })),
              );
              e.target.value = "";
            }}
          />
          <button
            className="btn-action-refined pulse"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiPlusCircle />
          </button>
          <button
            type="button"
            className={`btn-action-refined voice-btn ${isRecording ? "recording" : ""}`}
            onClick={toggleVoiceRecording}
            disabled={isSendingVoice}
            title={isRecording ? "Dung ghi am" : "Ghi am"}
          >
            {isRecording ? <FiStopCircle /> : <FiMic />}
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
