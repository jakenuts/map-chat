import React, { useState, KeyboardEvent } from 'react';
import { cn } from '../lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-input">
      <div className="flex items-center">
        <textarea
          className={cn(
            'chat-input-field',
            'resize-none',
            'min-h-[50px]',
            'max-h-[200px]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
        />
        <button
          className={cn(
            'send-button',
            (!message.trim() || disabled) && 'opacity-50 cursor-not-allowed'
          )}
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
        >
          Send
        </button>
      </div>
      {disabled && (
        <div className="text-sm text-gray-400 mt-1">
          Processing your request...
        </div>
      )}
    </div>
  );
};
