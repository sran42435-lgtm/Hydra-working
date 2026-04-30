import React from "react";
import { ChatPageMain } from "./ChatPageMain";
import FallbackChat from "./FallbackChat";

const USE_MODULAR = import.meta.env.VITE_MODULAR === "true";

export const ChatPageContainer: React.FC = () => {
  if (USE_MODULAR) {
    return <ChatPageMain />;
  }
  return <FallbackChat />;
};

export default ChatPageContainer;
