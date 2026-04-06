import { useState } from "react";
import Message from "./Message";

function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text) return;

    setMessages([...messages, { text, own: true }]);
    setText("");
  };

  return (
    <div className="chatbox">
      <div className="messages">
        {messages.map((m, i) => (
          <Message key={i} text={m.text} own={m.own} />
        ))}
      </div>

      <div className="input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={handleSend}>Gửi</button>
      </div>
    </div>
  );
}

export default ChatBox;
