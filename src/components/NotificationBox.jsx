import { useState } from "react";

const NotificationBox = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (noti) => {
    setNotifications((prev) => [noti, ...prev]);
  };

  return {
    notifications,
    addNotification,
  };
};

export default NotificationBox;