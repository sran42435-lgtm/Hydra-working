import React, { useState } from "react";
import { ChatPageSidebar } from "./ChatPageSidebar";
import { ChatSessionContainer } from "../../components/chat/ChatSessionContainer";

export const ChatPageMain: React.FC = () => {
  const [chatKey, setChatKey] = useState(0);

  const handleNewChat = () => {
    setChatKey(prev => prev + 1);
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", backgroundColor: "#0f172a" }}>
      <ChatPageSidebar onNewChat={handleNewChat} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ChatSessionContainer key={chatKey} />
      </div>
    </div>
  );
};
