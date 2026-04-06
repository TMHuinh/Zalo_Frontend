import Sidebar from "../components/Sidebar";
import ChatList from "../components/ChatList";
import ChatMain from "../components/ChatMain";
import "../css/chat.css";

function Chat() {
  return (
    <div className="chat-container">
      <Sidebar />
      <ChatList />
      <ChatMain />
    </div>
  );
}

export default Chat;
