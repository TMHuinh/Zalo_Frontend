import { useState } from "react";
import AddFriendModal from "../components/AddFriendModal";

function ChatList() {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const users = [{ id: 2, name: "My Documents" }];

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="chat-list">
      {/* SEARCH + BUTTON */}
      <div className="search-box" style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Tìm kiếm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />

        {/* 🔥 BUTTON ZALO STYLE */}
        <button
          onClick={() => setOpenModal(true)}
          style={{
            padding: "6px 10px",
            background: "#0b74e5",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          + Bạn
        </button>
      </div>

      {/* LIST */}
      <div className="list">
        {filtered.map((user) => (
          <div key={user.id} className="chat-item">
            <div className="avatar-small">
              {user.name.charAt(0)}
            </div>
            <div className="info">
              <p className="name">{user.name}</p>
              <span className="last-msg">Tin nhắn...</span>
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 MODAL */}
      {openModal && (
        <AddFriendModal onClose={() => setOpenModal(false)} />
      )}
    </div>
  );
}

export default ChatList;