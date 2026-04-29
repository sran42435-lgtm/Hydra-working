import React, { useState } from "react";
import { ChatPageSidebar } from "./ChatPageSidebar";
import { ChatSessionContainer } from "../../components/chat/ChatSessionContainer";

export const ChatPageMain: React.FC = () => {
  const [chatKey, setChatKey] = useState(0);

  const handleNewChat = () => setChatKey(prev => prev + 1);

  return (
    <div style={{
      display: "flex",
      height: "100dvh",
      width: "100vw",
      maxWidth: "100%",
      overflow: "hidden",
      backgroundColor: "#0f172a",
    }}>
      {/* Sidebar with fixed width */}
      <div style={{ flexShrink: 0, width: 260 }}>
        <ChatPageSidebar onNewChat={handleNewChat} />
      </div>

      {/* Chat area fills remaining space */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <ChatSessionContainer key={chatKey} />
      </div>
    </div>
  );
};
