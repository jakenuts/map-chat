import React from 'react';
import { cn } from '../lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, timestamp }) => {
  const isUser = role === 'user';

  return (
    <div className={cn(
      'chat-message',
      isUser ? 'user-message' : 'assistant-message'
    )}>
      <div className="font-medium">
        {isUser ? 'You' : 'Assistant'}
      </div>
      <div className="mt-1 whitespace-pre-wrap">
        {content}
      </div>
      <div className="message-timestamp">
        {timestamp}
      </div>
    </div>
  );
};
