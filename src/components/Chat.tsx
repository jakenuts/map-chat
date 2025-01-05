import React from 'react';
import { MapMethods } from '../lib/types';
import { ClaudeService, Message as ClaudeMessage } from '../lib/services/claude';
import { MapService } from '../lib/services/map';

type ChatMessage = ClaudeMessage & {
  id: string;
};

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
  // Initialize services
  const claudeService = React.useMemo(() => new ClaudeService(), []);
  const mapService = React.useMemo(() => mapMethods ? new MapService(mapMethods) : undefined, [mapMethods]);

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { id: 'system', role: 'system', content: SYSTEM_PROMPT }
  ]);
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSendMessage = React.useCallback(async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await claudeService.sendMessage([
        ...messages.map(({ role, content }) => ({ role, content })),
        { role: 'user', content: userMessage.content }
      ]);
      
      if (response.content?.[0]?.type === 'text') {
        const responseText = mapService ? 
          mapService.executeMapCommands(response.content[0].text) : 
          response.content[0].text;

        const assistantMessage: ChatMessage = {
          id: response.id,
          role: 'assistant',
          content: responseText
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: 'error',
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, messages, claudeService, mapService]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter(msg => msg.role !== 'system').map(message => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-200">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
