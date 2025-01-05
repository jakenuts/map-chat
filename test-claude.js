import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

async function testClaudeAPI() {
  const messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant with expertise in geography and local knowledge.'
    },
    {
      role: 'user',
      content: 'Tell me about Big Ben in London and show its location.'
    }
  ];

  try {
    const response = await fetch('http://localhost:3002/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant with expertise in geography and local knowledge. When discussing locations, be specific about their coordinates and use map commands to interact with the map interface.'
          },
          {
            role: 'user',
            content: 'Tell me about Big Ben in London and show its location.'
          }
        ],
        max_tokens: 4096,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Success! Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
console.log('Testing Claude API...');
testClaudeAPI();
