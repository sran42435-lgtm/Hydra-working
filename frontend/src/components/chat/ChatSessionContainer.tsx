// frontend/src/components/chat/ChatSessionContainer.tsx

import React from 'react';
import { useChatStore } from './useChatStore';
import { ChatInputBar } from './ChatInputBar';
import { MessageListView } from './MessageListView';
import { useMobileKeyboard } from '../../hooks/useMobileKeyboard';
import { useChatSession } from '../../hooks/useChatSession';

interface ChatSessionContainerProps {
  isDesktop?: boolean;
  sidebarWidth?: number;
}

export const ChatSessionContainer: React.FC<ChatSessionContainerProps> = ({
  isDesktop = false,
  sidebarWidth = 0,
}) => {
  const { isLoading, currentInput } = useChatStore();
  const { keyboardHeight } = useMobileKeyboard({ keyboardOffset: 250 });

  const {
    editingMessageIdRef,
    handleSend,
    handleStop,
    handleRetry,
    handleRegenerate,
    handleEditMessage,
    handleCancelEdit,
    handleTextChange,
  } = useChatSession();

  const isEditing = editingMessageIdRef.current !== null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'transparent',
        position: 'relative',
      }}
    >
      <MessageListView
        isLoading={isLoading}
        isDesktop={isDesktop}
        sidebarWidth={sidebarWidth}
        onEditMessage={handleEditMessage}
        onRetryMessage={handleRetry}
        onRegenerateMessage={handleRegenerate}
        editingMessageId={editingMessageIdRef.current}
        extraBottomPadding={keyboardHeight}
      />

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          pointerEvents: 'none',
          paddingLeft: isDesktop ? `${sidebarWidth}px` : '0',
          transition: isDesktop
            ? 'padding-left 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'none',
          backgroundColor: 'transparent',
        }}
      >
        <div style={{ pointerEvents: 'auto', maxWidth: '100%', margin: '0 auto' }}>
          <ChatInputBar
            text={currentInput || ''}
            onTextChange={handleTextChange}
            onSend={handleSend}
            onStop={handleStop}
            onCancelEdit={handleCancelEdit}
            disabled={isLoading}
            isLoading={isLoading}
            isEditing={isEditing}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatSessionContainer;
