import { HiChatAlt2, HiDocumentText, HiRefresh, HiSparkles, HiX } from "react-icons/hi";

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
              <h4>Tom tat tin nhan</h4>
              <span>Gom y nhanh nhung diem chinh trong cuoc tro chuyen</span>
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
              ? `${messageCount} tin nhan da tai`
              : "Chua co tin nhan"}
          </div>
          <div className="summary-meta-pill">
            <HiDocumentText size={16} />
            Ket qua tom tat
          </div>
        </div>

        <div className="summary-modal-body">
          {loading && (
            <div className="summary-modal-loading">
              Dang tao ban tom tat...
            </div>
          )}

          {!loading && error && (
            <div className="summary-modal-error">{error}</div>
          )}

          {!loading && !error && normalizedSummary && (
            <div className="summary-result-card">
              <div className="summary-result-label">
                <HiSparkles size={16} />
                Noi dung chinh
              </div>
              <div
                className="summary-content"
                dangerouslySetInnerHTML={{ __html: normalizedSummary }}
              />
            </div>
          )}

          {!loading && !error && !normalizedSummary && (
            <div className="summary-modal-empty">
              Bam nut ben duoi de tao tom tat cuoc tro chuyen.
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
            Tom tat lai
          </button>
        </div>
      </div>
    </div>
  );
}

export default SummaryModal;
