import { FiAlertTriangle, FiX } from "react-icons/fi";

function ViolationWarningModal({ show, content, message, onHide }) {
  if (!show) return null;

  return (
    <div className="violation-modal-overlay" onClick={onHide}>
      <div
        className="violation-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="violation-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="violation-modal-close"
          title="Đóng"
          onClick={onHide}
        >
          <FiX />
        </button>

        <div className="violation-modal-icon">
          <FiAlertTriangle />
        </div>

        <div className="violation-modal-content">
          <span className="violation-modal-kicker">Cảnh báo nội dung</span>
          <h3 id="violation-modal-title">Tin nhắn không thể gửi</h3>
          <p>{message || "Tin nhắn chứa nội dung vi phạm quy tắc cộng đồng."}</p>

          {content && (
            <div className="violation-modal-quote">
              <span>Nội dung bị chặn</span>
              <div>{content}</div>
            </div>
          )}

          <div className="violation-modal-actions">
            <button type="button" onClick={onHide}>
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViolationWarningModal;
