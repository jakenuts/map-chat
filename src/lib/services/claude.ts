import Anthropic from '@anthropic-ai/sdk';
import { logMessage } from '../utils/logging';

// Define our public interface types
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClaudeResponse {
  id: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  role: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeService {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly systemPrompt: string;

  constructor(
    model = 'claude-3-5-sonnet-20241022',
    systemPrompt = 'You are a helpful assistant with expertise in geography and local knowledge.'
  ) {
    this.client = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
      dangerouslyAllowBrowser: true
    });
    this.model = model;
    this.systemPrompt = systemPrompt;
  }

  async sendMessage(messages: Message[]): Promise<ClaudeResponse> {
    try {
      logMessage('send', { messages });

      // Extract user messages and handle system message separately
      const userMessages = messages.filter(msg => msg.role !== 'system');
      const systemMessage = messages.find(msg => msg.role === 'system')?.content || this.systemPrompt;

      const response = await this.client.messages.create({
        model: this.model,
        system: systemMessage,
        messages: userMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        max_tokens: 4096,
        temperature: 0.7,
      });

      // Transform response to match our interface
      const transformedResponse: ClaudeResponse = {
        id: response.id,
        content: response.content.map(block => ({
          type: block.type,
          text: 'text' in block ? block.text : JSON.stringify(block)
        })),
        role: response.role,
        model: response.model,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        }
      };

      logMessage('receive', { response: transformedResponse });
      return transformedResponse;
    } catch (error: any) {
      logMessage('error', {
        type: 'claude_api_error',
        error: error.message || 'Unknown error occurred',
      });
      throw error;
    }
  }
}
