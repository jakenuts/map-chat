import { ClaudeService } from './src/lib/services/claude';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testClaudeSDK() {
  const claudeService = new ClaudeService(
    'claude-3-5-sonnet-20241022',
    'You are a helpful assistant with expertise in geography and local knowledge. When discussing locations, be specific about their coordinates and use map commands to interact with the map interface.'
  );

  const messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }> = [
    {
      role: 'user',
      content: 'Tell me about Big Ben in London and show it on the map.'
    }
  ];

  try {
    console.log('Testing Claude API with SDK...');
    const response = await claudeService.sendMessage(messages);
    console.log('Success! Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
  }
}

// Run the test
console.log('Starting test...');
testClaudeSDK().catch(console.error);
