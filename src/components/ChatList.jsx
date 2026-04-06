import { useState } from "react";

function ChatList() {
  const [search, setSearch] = useState("");

  const users = [{ id: 2, name: "My Documents" }];

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="chat-list">
      {/* SEARCH */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Tìm kiếm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* LIST */}
      <div className="list">
        {filtered.map((user) => (
          <div key={user.id} className="chat-item">
            <div className="avatar-small">{user.name.charAt(0)}</div>
            <div className="info">
              <p className="name">{user.name}</p>
              <span className="last-msg">Tin nhắn...</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatList;
