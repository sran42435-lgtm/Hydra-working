/**
 * App Routes - Phase 1
 * Mendefinisikan routing aplikasi Hydra.
 * Di Phase 1 hanya memiliki rute untuk ChatPage.
 * Di Phase 2+ dapat ditambahkan rute untuk Settings, History, dll.
 */

import React from "react";
import { ChatPageContainer } from "../pages/ChatPage/ChatPageContainer";

/**
 * Phase 1: Hanya ada satu halaman (Chat).
 * Tidak memerlukan library routing.
 * Di Phase 2+, komponen ini dapat menggunakan react-router
 * untuk mendukung multiple halaman.
 */
export const AppRoutes: React.FC = () => {
  return <ChatPageContainer />;
};
