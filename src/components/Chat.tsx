import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { MapMethods } from '../lib/types';
import { ClaudeService, Message as ClaudeMessage } from '../lib/services/claude';
import { MapService } from '../lib/services/map';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatProps {
  mapMethods?: MapMethods;
}

const SYSTEM_PROMPT = `You are a helpful assistant with expertise in geography and local knowledge. When discussing locations, be specific about their coordinates and use map commands to interact with the map interface. Available commands:

[zoom_to lat lon zoom] - Focus the map on specific coordinates with optional zoom level
[add_feature geojson layerId] - Add a new feature to a specific layer
[modify_feature id properties] - Modify feature properties
[remove_feature id layerId] - Remove a feature
[style_feature id style] - Change feature appearance
[measure type ...features] - Calculate distances or areas
[buffer feature distance units] - Create buffer zones

Example response with commands:
"The Tower of London is a historic castle located in central London [zoom_to 51.5081 -0.0759 15]. Let me add it to the landmarks layer [add_feature {"type":"Feature","geometry":{"type":"Point","coordinates":[-0.0759,51.5081]},"properties":{"name":"Tower of London"}} landmarks]."`;

export const Chat: React.FC<ChatProps> = ({ mapMethods }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize services
  const claudeService = React.useMemo(() => new ClaudeService(), []);
  const mapService = React.useMemo(() => mapMethods ? new MapService(mapMethods) : undefined, [mapMethods]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const messageHistory: ClaudeMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content }
      ];

      const response = await claudeService.sendMessage(messageHistory);
      
      if (response.content?.[0]?.type === 'text') {
        const responseText = mapService ? 
          mapService.executeMapCommands(response.content[0].text) : 
          response.content[0].text;

        const assistantMessage: Message = {
          role: 'assistant',
          content: responseText,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, claudeService, mapService]);

  const memoizedMessages = React.useMemo(() => 
    messages.map((message, index) => (
      <ChatMessage
        key={index}
        role={message.role}
        content={message.content}
        timestamp={message.timestamp}
      />
    )), [messages]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {memoizedMessages}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};
