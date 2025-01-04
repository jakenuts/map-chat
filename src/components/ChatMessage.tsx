import React from 'react';
import { cn } from '../lib/utils';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  role,
  timestamp,
}) => {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex w-full items-start gap-4 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? 'U' : 'A'}
      </div>
      <div
        className={cn(
          'flex min-h-[20px] flex-1 flex-col gap-2 overflow-hidden rounded-lg px-4 py-2 shadow-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <div className="prose break-words dark:prose-invert">
          {content}
        </div>
        {timestamp && (
          <div className="text-xs opacity-50">{timestamp}</div>
        )}
      </div>
    </div>
  );
};
