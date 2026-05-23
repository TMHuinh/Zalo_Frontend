import { Modal, Button, ListGroup, Image } from "react-bootstrap";
import { FiSearch } from "react-icons/fi";

function ForwardModal({
  show,
  onHide,
  searchTerm,
  setSearchTerm,
  forwardList,
  handleSendForward,
}) {
  return (
    <Modal show={show} onHide={onHide} centered className="forward-modal shadow-lg">
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
  );
}

export default ForwardModal;
