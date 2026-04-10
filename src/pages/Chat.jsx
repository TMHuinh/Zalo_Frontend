import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatList from "../components/ChatList";
import ChatMain from "../components/ChatMain";
import ContactsPanel from "../components/ContactsPanel";
import "../css/chat.css";

function Chat() {
  const [tab, setTab] = useState("chat"); // chat | contacts

  return (
    <div className="chat-container">
      <Sidebar tab={tab} setTab={setTab} />

      {tab === "chat" && <ChatList />}
      {tab === "contacts" && <ContactsPanel />}

      <ChatMain />
    </div>
  );
}

export default Chat;