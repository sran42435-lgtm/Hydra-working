/**
 * Chat Page Container - Phase 1
 * Container halaman chat dengan error boundary.
 */

import React from "react";
import { ChatPageMain } from "./ChatPageMain";

export const ChatPageContainer: React.FC = () => {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <ChatPageMain />
    </div>
  );
};
