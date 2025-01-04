import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Marker {
  position: [number, number];
  title: string;
  description?: string;
}

interface ChatProps {
  onUpdateMarkers: (markers: Marker[]) => void;
}

export const Chat: React.FC<ChatProps> = ({ onUpdateMarkers }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseCoordinates = (text: string): Marker[] => {
    const markers: Marker[] = [];
    const regex = /([^[]+)\[(\d+\.\d+),\s*(-?\d+\.\d+)\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const [, description, lat, lon] = match;
      markers.push({
        position: [parseFloat(lat), parseFloat(lon)],
        title: description.trim(),
        description: description.trim()
      });
    }

    return markers;
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const initialPrompt = "You are a helpful assistant with expertise in geography and local knowledge. When discussing locations, be specific about their coordinates when possible, as this information may be used to update an interactive map. When you mention specific locations, please include their coordinates in [lat, lon] format at the end of the description. For example: 'The British Museum is a world-renowned museum in London [51.5194, -0.1270]'.";

      const messageHistory = [
        { role: 'user' as const, content: initialPrompt },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user' as const, content }
      ];

      console.log('API Request:', JSON.stringify({ messages: messageHistory }, null, 2));

      const response = await fetch('http://localhost:3001/api/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet',
          messages: messageHistory,
          max_tokens: 4096
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));

      if (data.content[0].type === 'text') {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content[0].text,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Parse coordinates and update markers
        const newMarkers = parseCoordinates(data.content[0].text);
        if (newMarkers.length > 0) {
          onUpdateMarkers(newMarkers);
        }
      }
    } catch (error) {
      console.error('Error calling Claude:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};
