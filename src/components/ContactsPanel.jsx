import { useState } from "react";
import { Form, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import useNotificationStore from "../store/notificationStore";
import AddFriendModal from "../components/AddFriendModal";
import CreateGroupModal from "./CreateGroupModal";
import { FiUserPlus } from "react-icons/fi";
import { HiUserGroup } from "react-icons/hi";
import toast from "react-hot-toast";
import "../css/contactsPanel.css";

function ContactsPanel({ contactView, setContactView, onSearch }) {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [openGroupModal, setOpenGroupModal] = useState(false);
  const { hasNewRequest } = useNotificationStore();

  const handleSearch = (value) => {
    setSearch(value);
    onSearch?.(value);
  };

  const items = [
    { key: "friends", label: "Danh sách bạn bè", icon: "👥" },
    { key: "requests", label: "Lời mời kết bạn", icon: "📩" },
    { key: "sent", label: "Lời mời đã gửi", icon: "📤" },
  ];

  return (
    <div
      className="p-3"
      style={{
        background: "#f1f5f9",
        height: "100%",
      }}
    >

      {/* 🔍 SEARCH (NEW UI) */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Form.Control
          placeholder="Tìm kiếm bạn bè..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            borderRadius: 20,
            height: 42,
            border: "1px solid #e2e8f0",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
          }}
          onFocus={(e) =>
            (e.target.style.boxShadow = "0 0 0 2px rgba(99,102,241,0.3)")
          }
          onBlur={(e) =>
            (e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.05)")
          }
        />

        {/* Nút Thêm bạn */}
        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip id="tooltip-add-friend">Thêm bạn</Tooltip>}
        >
          <Button
            onClick={() => setOpenModal(true)}
            style={{
              borderRadius: "50%",
              width: 42,
              height: 42,
              background: "#6366f1",
              border: "none",
              transition: "0.2s",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <FiUserPlus />
          </Button>
        </OverlayTrigger>

        {/* Nút Tạo nhóm */}
        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip id="tooltip-create-group">Tạo nhóm</Tooltip>}
        >
          <Button
            onClick={() => setOpenGroupModal(true)}
            style={{
              borderRadius: "50%",
              width: 42,
              height: 42,
              background: "#10b981",
              border: "none",
              transition: "0.2s",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <HiUserGroup />
          </Button>
        </OverlayTrigger>
      </div>

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
                borderRadius: 16,
                background: isActive ? "#eef2ff" : "#fff",
                boxShadow: isActive
                  ? "0 6px 16px rgba(99,102,241,0.25)"
                  : "0 2px 8px rgba(0,0,0,0.06)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
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
      {openModal && <AddFriendModal onClose={() => setOpenModal(false)} />}

      {openGroupModal && (
        <CreateGroupModal
          onClose={() => setOpenGroupModal(false)}
          onCreated={() => {
            setOpenGroupModal(false);
          }}
        />
      )}
    </div>
  );
}

export default ContactsPanel;