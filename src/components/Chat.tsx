import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { MapMethods, MapCommand } from '../lib/types';
import { extractMapCommands } from '../lib/commandParser';

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const executeMapCommands = (text: string) => {
    if (!mapMethods) return text;

    const commands = extractMapCommands(text);
    commands.forEach(command => {
      try {
        switch (command.type) {
          case 'zoom_to':
            mapMethods.zoomTo(command.parameters.coordinates, command.parameters.zoom);
            break;
          case 'add_feature':
            mapMethods.addFeature(
              command.parameters.feature,
              command.parameters.layerId,
              command.parameters.style
            );
            break;
          case 'modify_feature':
            mapMethods.modifyFeature(
              command.parameters.featureId,
              command.parameters.properties
            );
            break;
          case 'remove_feature':
            mapMethods.removeFeature(
              command.parameters.featureId,
              command.parameters.layerId
            );
            break;
          case 'style_feature':
            mapMethods.styleFeature(
              command.parameters.featureId,
              command.parameters.style
            );
            break;
          case 'measure':
            const result = mapMethods.measure(
              command.parameters.type,
              command.parameters.features
            );
            console.log(`Measurement result: ${result}`);
            break;
          case 'buffer':
            const buffered = mapMethods.buffer(
              command.parameters.feature,
              command.parameters.distance,
              command.parameters.units
            );
            mapMethods.addFeature(buffered, 'buffers');
            break;
        }
      } catch (error) {
        console.error(`Error executing map command: ${command.type}`, error);
      }
    });

    return text;
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
      const messageHistory = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user' as const, content }
      ];

      const response = await fetch('http://localhost:3001/api/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet',
          messages: messageHistory,
          max_tokens: 4096,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.content[0].type === 'text') {
        const responseText = executeMapCommands(data.content[0].text);
        const assistantMessage: Message = {
          role: 'assistant',
          content: responseText,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error calling Claude:', error);
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
