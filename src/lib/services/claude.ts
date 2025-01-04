// Claude API service
import { logMessage } from '../utils/logging';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeService {
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(apiUrl = 'http://localhost:3002/api/messages', model = 'claude-3-5-sonnet-20241022') {
    this.apiUrl = apiUrl;
    this.model = model;
  }

  async sendMessage(messages: Message[]): Promise<ClaudeResponse> {
    try {
      logMessage('send', { messages });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        logMessage('error', { status: response.status, error: errorData });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logMessage('receive', { response: data });

      return data;
    } catch (error: any) {
      logMessage('error', {
        type: 'claude_api_error',
        error: error.message || 'Unknown error occurred',
      });
      throw error;
    }
  }
}
