import React, { useState, useEffect } from "react";

interface NotificationProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

const Notification: React.FC<NotificationProps> = ({ message, type, visible }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (visible) {
      setFade(true);
      setTimeout(() => {
        setFade(false);
      }, 3000); // Fade out after 3 seconds
    }
  }, [visible]);

  return (
    <div
      className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-md ${
        fade ? "opacity-100" : "opacity-0"
      } transition-opacity duration-500 ${
        type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
      style={{ transition: "opacity 0.5s ease-in-out" }}
    >
      {message}
    </div>
  );
};

export default Notification;
