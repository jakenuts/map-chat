# Map Chat - Advanced Geospatial Chat Interface

## Project Vision
Map Chat is an advanced geospatial chat interface that combines AI-powered conversation with interactive mapping capabilities. Users can manipulate and analyze geographic data through natural language commands, with the AI assistant understanding and executing complex spatial operations while maintaining context across conversations.

## Architecture

### Proxy Server
The project includes a proxy server (proxy-server.js) that serves several critical functions:

1. Security
   - Protects the Anthropic API key by keeping it server-side
   - Prevents direct exposure of credentials in client-side code
   - Manages API authentication headers

2. CORS and Request Management
   - Handles Cross-Origin Resource Sharing (CORS) headers
   - Manages API versioning through header transformation
   - Provides request/response logging for debugging
   - Transforms API endpoints for cleaner client integration

3. Request Processing
   - Rewrites paths from /api/messages to /v1/messages
   - Adds necessary Anthropic API headers
   - Manages content-type and other HTTP headers
   - Provides detailed request/response logging

4. Error Handling
   - Logs API interactions for debugging
   - Provides consistent error reporting
   - Maintains security during error states

## Current Features (✓ = Completed)
- Core Infrastructure
  - ✓ React + TypeScript setup with Vite
  - ✓ Split-pane interface (Chat/Map)
  - ✓ Leaflet map integration
  - ✓ Claude API integration
  - ✓ Proxy server for API security
  - ✓ Environment variable management
  - ✓ Basic coordinate parsing and marker placement

- Chat Interface
  - ✓ Message history display
  - ✓ Real-time message updates
  - ✓ Loading states
  - ✓ Error handling
  - ⚡ Context-aware conversations (In Progress)

- Map Features
  - ✓ Basic marker placement
  - ✓ OpenStreetMap integration
  - ⚡ Dynamic layer management (In Progress)
  - ⚡ Map control commands (In Progress)

## Planned Features
1. Map Control Commands
   - zoom_to: Focus map on specific location/feature
   - add_feature: Add new elements to dynamic layers
   - modify_feature: Edit existing features
   - remove_feature: Delete features
   - style_feature: Change feature appearance
   - measure: Calculate distances/areas
   - buffer: Create buffer zones

2. Data Management
   - Import/Export KML files
   - Photo geotagging and display
   - External data source integration
   - Layer management system
   - Custom styling options
   - Version control for features

3. Analysis Tools
   - Spatial queries
   - Distance calculations
   - Area measurements
   - Routing capabilities
   - Geocoding/reverse geocoding
   - Terrain analysis

4. UI Enhancements
   - Layer control panel
   - Feature property editor
   - Style editor
   - Export options
   - Search functionality
   - History browser

## Implementation Steps

### Current Phase (Map Control Integration)
1. ⚡ Define map control command interface
   ```typescript
   interface MapCommand {
     type: 'zoom_to' | 'add_feature' | 'modify_feature' | 'remove_feature' | 'style_feature';
     parameters: Record<string, any>;
   }
   ```

2. ⚡ Implement command parser in Chat component
   - Parse natural language into structured commands
   - Validate command parameters
   - Handle command errors

3. ⚡ Add map control methods to MapComponent
   ```typescript
   interface MapMethods {
     zoomTo(coordinates: [number, number], zoom: number): void;
     addFeature(feature: GeoJSON.Feature): void;
     modifyFeature(id: string, properties: any): void;
     removeFeature(id: string): void;
     styleFeature(id: string, style: L.PathOptions): void;
   }
   ```

4. Next Steps:
   - Implement layer management system
   - Add KML import/export functionality
   - Create feature property editor
   - Add style editor interface
   - Implement history tracking

### Future Phases
1. Data Import/Export (Priority: High)
   - KML parser implementation
   - File upload interface
   - Export functionality
   - Data validation

2. Analysis Tools (Priority: Medium)
   - Spatial query engine
   - Measurement tools
   - Routing integration
   - Terrain analysis

3. UI Improvements (Priority: Medium)
   - Layer panel design
   - Property editor
   - Style interface
   - History browser

4. Advanced Features (Priority: Low)
   - 3D visualization
   - Time-based animations
   - Collaborative editing
   - Custom projections

## Development Handoff Prompt

You are continuing development of the Map Chat project, an advanced geospatial chat interface. The project combines AI-powered conversation with interactive mapping capabilities. Here's your current context:

1. The project uses React 19, TypeScript, and Leaflet for mapping.
2. Claude API integration is implemented but needs enhancement for map control commands.
3. Current focus is on implementing map control features (zoom_to, add_feature, etc.).
4. The codebase follows functional React patterns with TypeScript for type safety.

Your immediate tasks:
1. Implement the MapCommand interface and command parser
2. Add map control methods to MapComponent
3. Enhance Claude's understanding of spatial commands
4. Begin work on the layer management system

Key files to focus on:
- src/components/MapComponent.tsx: Add map control methods
- src/components/Chat.tsx: Enhance command parsing
- src/lib/utils.ts: Add command validation utilities

Development standards:
1. Use TypeScript for all new code
2. Write tests for new functionality
3. Document all public interfaces
4. Follow existing code style
5. Maintain type safety
6. Use functional components with hooks
7. Keep components focused and modular

The project aims to be a professional-grade tool for geospatial data manipulation through natural language. Maintain high standards for code quality, performance, and user experience.

## Next Development Session

The next development session should focus on:
1. Implementing the map control command system
2. Testing command parsing and execution
3. Enhancing Claude's understanding of spatial operations
4. Beginning work on the layer management system

Remember to:
- Update documentation as features are added
- Maintain type safety throughout
- Consider edge cases and error states
- Keep the codebase clean and maintainable
