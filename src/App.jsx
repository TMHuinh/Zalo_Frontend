import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import PrivateRoute from "./components/PrivateRoute";
import ChangePassword from "./components/ChangePassword";
import Policy from "./pages/Policy";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useRef } from "react";
import socket from "./socket/socket";
import useNotificationStore from "./store/notificationStore";

function App() {
  const isFirstLoad = useRef(true); // 🔥 chặn badge chạy nhiều lần

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const { setNewRequest } = useNotificationStore.getState();

    // ================= CONNECT =================
    const handleConnect = () => {
      console.log("🔥 SOCKET CONNECTED");
      socket.emit("join", userId);
    };

    // ================= REALTIME =================
    const handleNotification = (noti) => {
      console.log("🔥 GLOBAL NOTI:", noti);

      const data = noti?.data || {};

      if (data.status === "pending") {
        setNewRequest(true); // 🔴 realtime
      }
    };

    // ================= LOGIN BADGE =================
    const handleBadge = ({ unreadCount }) => {
      console.log("🔥 GLOBAL BADGE:", unreadCount);

      // 👉 chỉ chạy 1 lần sau login
      if (isFirstLoad.current) {
        if (unreadCount > 0) {
          setNewRequest(true); // 🔴 từ DB
        }

        isFirstLoad.current = false;
      }
    };

    socket.on("connect", handleConnect);
    socket.on("notification:new", handleNotification);
    socket.on("notification:badge", handleBadge);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("notification:new", handleNotification);
      socket.off("notification:badge", handleBadge);
    };
  }, []);

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />

      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{ zIndex: 999999999 }}
      />

      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />

        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/policy" element={<Policy />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;