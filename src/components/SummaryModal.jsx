import {
  HiChatAlt2,
  HiDocumentText,
  HiRefresh,
  HiSparkles,
  HiX,
} from "react-icons/hi";

function SummaryModal({
  show,
  onHide,
  summary,
  loading,
  error,
  messageCount,
  onSummarize,
}) {
  if (!show) return null;

  const normalizedSummary = summary
    ?.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    ?.replace(/\son\w+="[^"]*"/gi, "")
    ?.trim();

  return (
    <div className="summary-modal-overlay" onClick={onHide}>
      <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="summary-modal-header">
          <div className="summary-modal-title-wrap">
            <div className="summary-modal-icon">
              <HiSparkles size={20} />
            </div>
            <div>
              <h4>Tóm Tắt Tin Nhắn</h4>
              <span>Góp ý nhanh những điểm chính trong cuộc trò chuyện</span>
            </div>
          </div>
          <button className="summary-modal-close" onClick={onHide}>
            <HiX size={20} />
          </button>
        </div>

        <div className="summary-modal-meta">
          <div className="summary-meta-pill">
            <HiChatAlt2 size={16} />
            {messageCount > 0
              ? `${messageCount} tin nhắn đã tải`
              : "Chưa có tin nhắn"}
          </div>
          <div className="summary-meta-pill">
            <HiDocumentText size={16} />
            Kết quả tóm tắt
          </div>
        </div>

        <div className="summary-modal-body">
          {loading && (
            <div className="summary-modal-loading">Đang tạo bản tóm tắt...</div>
          )}

          {!loading && error && (
            <div className="summary-modal-error">Vui lòng thử lại sau</div>
          )}

          {!loading && !error && normalizedSummary && (
            <div className="summary-result-card">
              <div className="summary-result-label">
                <HiSparkles size={16} />
                Nội dung chính
              </div>
              <div
                className="summary-content"
                dangerouslySetInnerHTML={{ __html: normalizedSummary }}
              />
            </div>
          )}

          {!loading && !error && !normalizedSummary && (
            <div className="summary-modal-empty">
              Bấm nút bên dưới để tạo tóm tắt cuộc trò chuyện.
            </div>
          )}
        </div>

        <div className="summary-modal-footer">
          <button
            type="button"
            className="summary-modal-submit"
            onClick={onSummarize}
            disabled={loading || messageCount === 0}
          >
            <HiRefresh size={18} />
            Tóm tắt lại
          </button>
        </div>
      </div>
    </div>
  );
}

export default SummaryModal;
