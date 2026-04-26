/**
 * Chat Page Container - Phase 1
 * Container halaman chat dengan error boundary.
 * Di Phase 2+ dapat ditambahkan provider context, autentikasi guard, dll.
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
