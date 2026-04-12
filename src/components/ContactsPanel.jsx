import { useState } from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
import useNotificationStore from "../store/notificationStore";
import AddFriendModal from "../components/AddFriendModal";

function ContactsPanel({ contactView, setContactView, onSearch }) {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const { hasNewRequest } = useNotificationStore();

  const handleSearch = (value) => {
    setSearch(value);
    onSearch?.(value); // 🔥 truyền xuống Content
  };

  const items = [
    { key: "friends", label: "Danh sách bạn bè", icon: "👥" },
    { key: "requests", label: "Lời mời kết bạn", icon: "📩" },
    { key: "sent", label: "Lời mời đã gửi", icon: "📤" },
  ];

  return (
    <div className="p-2" style={{ background: "#f5f7fb", height: "100%" }}>
      {/* 🔍 SEARCH */}
      <InputGroup className="mb-3">
        <Form.Control
          placeholder="🔍 Tìm kiếm bạn bè..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ borderRadius: "12px 0 0 12px" }}
        />

        <Button
          variant="primary"
          onClick={() => setOpenModal(true)}
          style={{ borderRadius: "0 12px 12px 0" }}
        >
          + Bạn
        </Button>
      </InputGroup>

      {/* MENU */}
      <div className="d-flex flex-column gap-2">
        {items.map((item) => {
          const isActive = contactView === item.key;

          return (
            <div
              key={item.key}
              onClick={() => setContactView(item.key)}
              style={{
                cursor: "pointer",
                padding: "12px",
                borderRadius: 14,
                background: isActive ? "#e7f1ff" : "#fff",
                boxShadow: isActive
                  ? "0 4px 12px rgba(0,0,0,0.08)"
                  : "0 2px 6px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 18 }}>{item.icon}</div>

              <div
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  position: "relative",
                }}
              >
                {item.label}

                {item.key === "requests" && hasNewRequest && (
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      right: -10,
                      width: 8,
                      height: 8,
                      background: "red",
                      borderRadius: "50%",
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {openModal && (
        <AddFriendModal onClose={() => setOpenModal(false)} />
      )}
    </div>
  );
}

export default ContactsPanel;