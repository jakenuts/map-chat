import React, { useState } from 'react';
import { Chat } from './components/Chat';
import { MapComponent } from './components/MapComponent';
import { MapMethods } from './lib/types';
import './App.css';

function App() {
  const [mapMethods, setMapMethods] = useState<MapMethods>();

  const handleMapMethods = (methods: MapMethods) => {
    setMapMethods(methods);
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 border-r border-gray-200">
        <Chat mapMethods={mapMethods} />
      </div>
      <div className="w-1/2">
        <MapComponent onMapMethods={handleMapMethods} />
      </div>
    </div>
  );
}

export default App;
