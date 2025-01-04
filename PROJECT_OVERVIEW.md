# Map Chat Project Overview

## Project Vision
Map Chat is an interactive web application that combines real-time chat functionality with an interactive map interface. Users can chat with Claude AI about locations, and the AI's responses automatically update markers on the map based on the locations discussed. This creates an engaging way to explore and learn about geographical locations while visualizing them in real-time.

## Tech Stack
- **Frontend Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Map Component**: Leaflet with OpenStreetMap
- **AI Integration**: Claude 3 via Anthropic's API
- **Proxy Server**: Express.js (for handling CORS and API key management)

## Core Features
1. Split-pane interface with chat on the left and map on the right
2. Real-time chat interaction with Claude AI
3. Automatic location marker placement on map
4. Coordinate parsing and map marker management
5. Responsive design for various screen sizes

## Key Components
1. **Chat Component** (`src/components/Chat.tsx`)
   - Manages chat state and message history
   - Handles API communication with Claude
   - Parses coordinates from responses
   - Triggers map marker updates

2. **Map Component** (`src/components/MapComponent.tsx`)
   - Renders interactive OpenStreetMap
   - Manages map markers and their updates
   - Handles zoom and pan controls

3. **Chat Input** (`src/components/ChatInput.tsx`)
   - User message input interface
   - Message submission handling

4. **Chat Message** (`src/components/ChatMessage.tsx`)
   - Individual message display
   - Role-based styling (user vs assistant)
   - Timestamp display

5. **Proxy Server** (`proxy-server.js`)
   - Handles CORS issues
   - Manages API key securely
   - Routes requests to Anthropic's API

## Completed Tasks
1. ✅ Project initialization with Vite and React
2. ✅ Basic project structure setup
3. ✅ Implementation of split-pane layout
4. ✅ Integration of Leaflet map component
5. ✅ Basic chat interface implementation
6. ✅ Chat message components styling
7. ✅ Claude API integration setup
8. ✅ Coordinate parsing functionality
9. ✅ Map marker management system
10. ✅ Environment variable configuration
11. ✅ Initial proxy server setup

## Pending Tasks
1. 🔄 Fix proxy server CORS and endpoint issues
2. 📝 Implement proper error handling and user feedback
3. 📝 Add loading states and indicators
4. 📝 Implement message persistence
5. 📝 Add marker clustering for multiple locations
6. 📝 Implement marker info windows
7. 📝 Add marker animation on placement
8. 📝 Implement map bounds adjustment
9. 📝 Add location search functionality
10. 📝 Implement chat history
11. 📝 Add export/share functionality
12. 📝 Implement responsive design improvements
13. 📝 Add unit and integration tests
14. 📝 Implement proper documentation
15. 📝 Add deployment configuration

## Current Challenges
1. CORS issues with Anthropic API
2. Proxy server endpoint configuration
3. API key security management

## Future Enhancements
1. Support for different map providers
2. Custom marker icons based on location type
3. Route visualization between markers
4. Location-based chat suggestions
5. Multi-language support
6. User authentication
7. Saved conversations and locations
8. Mobile app version

## Development Guidelines
1. Follow TypeScript best practices
2. Use functional components with hooks
3. Implement proper error boundaries
4. Write meaningful commit messages
5. Document complex logic
6. Follow Tailwind CSS class naming conventions
7. Use proper type definitions
8. Implement proper loading states
9. Handle edge cases gracefully

## Environment Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env` file with required variables:
   - `VITE_ANTHROPIC_API_KEY`
4. Start development server: `npm run dev`
5. Start proxy server: `node proxy-server.js`

## API Integration
The application uses Claude 3 API with the following configuration:
1. Model: claude-3-sonnet
2. Max tokens: 4096
3. System prompt: Geography expert with coordinate knowledge
4. Message format: Includes coordinate parsing for map integration

## Current Status
The project is in active development with basic functionality working. The main focus is currently on resolving API integration issues and improving the user experience. The core chat and map functionality are implemented, but need refinement and additional features for a production-ready application.
