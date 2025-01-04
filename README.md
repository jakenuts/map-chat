# Map Chat

An interactive web application that combines real-time chat with Claude AI and an interactive map interface. Users can chat about locations, and the AI's responses automatically update markers on the map based on the locations discussed.

## Features

- Split-pane interface with chat and map
- Real-time chat interaction with Claude AI
- Automatic location marker placement
- Coordinate parsing and map marker management
- Responsive design

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Leaflet with OpenStreetMap
- Claude 3 API
- Express.js proxy server

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/map-chat.git
cd map-chat
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example` and add your Anthropic API key:
```bash
VITE_ANTHROPIC_API_KEY=your-anthropic-api-key-here
PROXY_ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

4. Start the development server:
```bash
npm run dev
```

5. Start the proxy server (in a separate terminal):
```bash
node proxy-server.js
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Development

- The frontend runs on port 5173
- The proxy server runs on port 3001
- Environment variables are managed through `.env` file
- The project uses ESLint and Prettier for code formatting

## Project Structure

```
map-chat/
├── src/
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   └── MapComponent.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   └── main.tsx
├── proxy-server.js
├── .env.example
└── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
