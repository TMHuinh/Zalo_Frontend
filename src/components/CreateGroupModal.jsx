import { useEffect, useState, useMemo } from "react";
import { Modal, Button, Form, Image, Badge } from "react-bootstrap";
import friendshipApi from "../api/friendshipApi";
import conversationApi from "../api/conversationApi";
import { getUserIdFromToken } from "../utils/auth";
import toast, { Toaster } from "react-hot-toast"; // 👈 Nhớ import thêm Toaster ở đây

function CreateGroupModal({ onClose, onCreated }) {
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");

  const currentUserId = getUserIdFromToken();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await friendshipApi.getFriends();
        const data = res.data?.data;

        if (!data) return;

        if (Array.isArray(data)) {
          setFriends(data);
        } else {
          const flat = Object.values(data).flat();
          setFriends(flat);
        }
      } catch (err) {
        console.log("Fetch friends error:", err);
      }
    };

    fetchFriends();
  }, []);

  const toggleUser = (userId) => {
    setSelected((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const filteredFriends = useMemo(() => {
    const keyword = search.toLowerCase();
    return friends.filter((f) => f.fullName?.toLowerCase().includes(keyword));
  }, [friends, search]);

  const handleCreate = async () => {
    if (selected.length < 2) {
      toast.error("Vui lòng chọn ít nhất 2 thành viên");
      return;
    }

    try {
      const res = await conversationApi.createGroup({
        currentUserId,
        name: groupName,
        memberIds: selected,
      });

      toast.success("Tạo nhóm thành công! 🎉");

      onCreated?.(res.data.data || res.data.result);
      onClose();
    } catch (err) {
      console.log(err);
      toast.error("Tạo nhóm thất bại, vui lòng thử lại!");
    }
  };

  return (
    <Modal show onHide={onClose} centered>
      
      {/* 🔥 ĐẶT TOASTER TRỰC TIẾP VÀO TRONG MODAL, ÉP Z-INDEX > 1055 (Mặc định của Bootstrap Modal) */}
      <Toaster position="top-center" reverseOrder={false} containerStyle={{ zIndex: 999999 }} />

      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "18px", fontWeight: "bold" }}>
          Tạo nhóm mới
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Control
          placeholder="Tên nhóm (có thể bỏ trống)"
          className="mb-3"
          style={{ borderRadius: "12px", padding: "10px 15px" }}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <Form.Control
          placeholder="Tìm bạn bè..."
          className="mb-3"
          style={{
            borderRadius: "20px",
            padding: "8px 15px",
            backgroundColor: "#f0f2f5",
            border: "none",
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {selected.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-3">
            {selected.map((id) => {
              const user = friends.find((f) => f._id === id);
              if (!user) return null;

              return (
                <Badge
                  key={id}
                  bg="primary"
                  style={{
                    cursor: "pointer",
                    padding: "6px 10px",
                    borderRadius: "15px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                  onClick={() => toggleUser(id)}
                >
                  {user.fullName} <span style={{ fontSize: "10px" }}>✕</span>
                </Badge>
              );
            })}
          </div>
        )}

        <div style={{ maxHeight: 300, overflowY: "auto", paddingRight: "5px" }}>
          {filteredFriends.length === 0 && (
            <div style={{ textAlign: "center", color: "#999", padding: "20px 0" }}>
              Không tìm thấy bạn bè nào
            </div>
          )}

          {filteredFriends.map((user) => (
            <div
              key={user._id}
              onClick={() => toggleUser(user._id)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: 10,
                cursor: "pointer",
                borderRadius: 12,
                marginBottom: 8,
                background: selected.includes(user._id) ? "#eef2ff" : "#fff",
                border: selected.includes(user._id)
                  ? "1px solid #c7d2fe"
                  : "1px solid transparent",
                transition: "all 0.2s ease",
              }}
            >
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  roundedCircle
                  width={42}
                  height={42}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center text-white"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                    fontWeight: 600,
                  }}
                >
                  {user.fullName?.charAt(0) || "U"}
                </div>
              )}

              <div style={{ marginLeft: 12, flex: 1, fontWeight: 500, color: "#333" }}>
                {user.fullName}
              </div>

              {selected.includes(user._id) && (
                <Badge bg="primary" style={{ borderRadius: "50%", padding: "5px" }}>
                  ✓
                </Badge>
              )}
            </div>
          ))}
        </div>
      </Modal.Body>

      <Modal.Footer style={{ borderTop: "none", padding: "15px 20px" }}>
        <Button variant="light" onClick={onClose} style={{ borderRadius: "10px" }}>
          Huỷ
        </Button>
        <Button variant="primary" onClick={handleCreate} style={{ borderRadius: "10px", padding: "6px 20px" }}>
          Tạo nhóm
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CreateGroupModal;