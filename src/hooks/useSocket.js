import { useEffect } from "react";
import socket from "../socket/socket";

const useSocket = (userId, onNotification) => {
  useEffect(() => {
    if (!userId) return;

    socket.connect();

    socket.emit("join", userId);

    socket.on("notification:new", (data) => {
      console.log("🔔 Notification:", data);
      onNotification?.(data);
    });

    socket.on("notification:badge", (data) => {
      console.log("🔢 Badge:", data);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return socket;
};

export default useSocket;