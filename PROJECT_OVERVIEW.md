# Map Chat Project Overview

## Project Description
Map Chat is an interactive web application that combines chat functionality with map visualization capabilities. It uses Claude AI to provide intelligent responses about geographical locations and can manipulate a map interface based on the conversation.

## Key Features
1. Chat Interface:
   - Real-time communication with Claude AI
   - Geographic information queries
   - Map command integration
   - Error handling and recovery

2. Map Integration:
   - Interactive map display
   - Location visualization
   - Geographic feature manipulation
   - Command parsing and execution

3. AI Integration:
   - Claude 3 Sonnet model integration
   - Geographic expertise
   - Map command generation
   - Context-aware responses

## Technical Stack

### Frontend
- React 19.0.0
- TypeScript
- Vite 6.0.7
- Tailwind CSS
- Leaflet for mapping

### AI Integration
- @anthropic-ai/sdk 0.33.1
- Claude-3-5-sonnet-20241022 model
- Browser-compatible configuration
- Type-safe implementation

### Development Tools
- pnpm package manager
- ESLint
- TypeScript compiler
- Vite dev server
- Testing utilities

## Architecture

### Core Components
1. Chat Component:
   - Message handling
   - User input management
   - Response rendering
   - Error boundaries

2. Map Component:
   - Leaflet integration
   - Command execution
   - Feature management
   - Geographic visualization

3. Claude Service:
   - AI communication
   - Message formatting
   - Response parsing
   - Error handling

### Services
1. Map Service:
   - Command parsing
   - Feature manipulation
   - Geographic calculations
   - State management

2. Claude Service:
   - AI communication
   - Message handling
   - Response transformation
   - Error management

## Development Setup

### Prerequisites
- Node.js
- pnpm
- Claude API key
- Modern web browser

### Environment Configuration
```bash
# Required environment variables
VITE_ANTHROPIC_API_KEY=your-api-key
```

### Getting Started
1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start development server:
   ```bash
   pnpm start
   ```

3. Run tests:
   ```bash
   pnpm test
   ```

## Project Structure
```
src/
  ├── components/       # React components
  ├── lib/             # Core libraries
  │   ├── services/    # Service implementations
  │   ├── utils/       # Utility functions
  │   └── hooks/       # React hooks
  ├── assets/          # Static assets
  └── types/           # TypeScript definitions
```

## Best Practices
1. Code Quality:
   - TypeScript for type safety
   - ESLint for code style
   - Error boundaries for resilience
   - Comprehensive logging

2. Development Workflow:
   - Regular commits
   - Documentation updates
   - Testing before deployment
   - Error handling

3. Security:
   - Environment variable management
   - API key protection
   - Safe browser configuration
   - Error message sanitization

## Future Enhancements
1. Features:
   - Additional map commands
   - Enhanced visualization
   - Batch operations
   - Performance optimizations

2. Technical:
   - Additional test coverage
   - Performance monitoring
   - Error tracking
   - Analytics integration

## Documentation
- Developer Log: Detailed development history
- API Documentation: Service interfaces
- Component Documentation: Usage guides
- Setup Guide: Installation steps

## Support
For issues and questions:
1. Check the developer log
2. Review error messages
3. Test in isolation
4. Update dependencies
