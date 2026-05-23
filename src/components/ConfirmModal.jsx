import { Modal, Button } from "react-bootstrap";
import { FiAlertCircle } from "react-icons/fi";

function ConfirmModal({ show, type, onHide, onConfirm }) {
  return (
    <Modal show={show} onHide={onHide} centered className="confirm-modal">
      <Modal.Body className="text-center p-4">
        <div className="confirm-icon mb-3">
          <FiAlertCircle
            size={50}
            color={type === "revoke" ? "#ff9800" : "#f44336"}
          />
        </div>
        <h5 className="mb-2" style={{ fontWeight: "bold" }}>
          {type === "revoke" ? "Thu hồi tin nhắn?" : "Xóa tin nhắn?"}
        </h5>
        <p className="text-muted mb-4">
          {type === "revoke"
            ? "Tin nhắn này sẽ bị gỡ bỏ đối với tất cả thành viên."
            : "Tin nhắn này sẽ chỉ bị xóa ở phía bạn."}
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <Button
            variant="light"
            onClick={onHide}
            style={{ borderRadius: "10px", padding: "8px 25px" }}
          >
            Hủy
          </Button>
          <Button
            variant={type === "revoke" ? "warning" : "danger"}
            onClick={onConfirm}
            style={{
              borderRadius: "10px",
              padding: "8px 25px",
              color: "white",
            }}
          >
            {type === "revoke" ? "Thu hồi" : "Xóa"}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default ConfirmModal;
