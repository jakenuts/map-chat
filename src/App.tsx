import React, { useState } from 'react';
import { Chat } from './components/Chat';
import { MapComponent } from './components/MapComponent';

interface Marker {
  position: [number, number];
  title: string;
  description?: string;
}

const App: React.FC = () => {
  const [markers, setMarkers] = useState<Marker[]>([
    {
      position: [51.505, -0.09],
      title: 'London',
      description: 'The capital of England'
    }
  ]);

  const handleMarkersUpdate = (newMarkers: Marker[]) => {
    setMarkers(prevMarkers => [...prevMarkers, ...newMarkers]);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left pane - Chat */}
      <div className="w-1/2 border-r flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <h1 className="text-xl font-semibold">Chat with Claude</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <Chat onUpdateMarkers={handleMarkersUpdate} />
        </div>
      </div>

      {/* Right pane - Map */}
      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <h1 className="text-xl font-semibold">Interactive Map</h1>
        </div>
        <div className="flex-1 p-4">
          <div className="h-full rounded-lg overflow-hidden border shadow-sm">
            <MapComponent 
              markers={markers}
              center={[51.505, -0.09]}
              zoom={13}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
