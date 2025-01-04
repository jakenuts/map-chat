import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, LayersControl, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { lineString, polygon, featureCollection } from '@turf/helpers';
import length from '@turf/length';
import area from '@turf/area';
import buffer from '@turf/buffer';
import { MapMethods, MapState, Layer } from '../lib/types';
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

interface MapComponentProps {
  onMapReady: (methods: MapMethods) => void;
}

// Map Controller component to handle map methods
const MapController: React.FC<{ onMapReady: (methods: MapMethods) => void }> = ({ onMapReady }) => {
  const map = useMap();
  const layerGroups = useRef<Record<string, L.LayerGroup>>({});

  useEffect(() => {
    const methods: MapMethods = {
      zoomTo: (coordinates: [number, number], zoom: number = 13) => {
        map.setView(coordinates, zoom);
      },

      addFeature: (feature, layerId = 'default', style) => {
        if (!layerGroups.current[layerId]) {
          layerGroups.current[layerId] = L.layerGroup().addTo(map);
        }

        const layer = L.geoJSON(feature as GeoJSON.GeoJsonObject, { style });
        layerGroups.current[layerId].addLayer(layer);
      },

      modifyFeature: (featureId, properties) => {
        Object.values(layerGroups.current).forEach(group => {
          group.eachLayer(layer => {
            if (layer instanceof L.GeoJSON && 
                layer.feature && 
                'id' in layer.feature && 
                layer.feature.id === featureId) {
              layer.feature.properties = { 
                ...(layer.feature.properties || {}), 
                ...properties 
              };
            }
          });
        });
      },

      removeFeature: (featureId, layerId?) => {
        const groups = layerId 
          ? [layerGroups.current[layerId]]
          : Object.values(layerGroups.current);

        groups.forEach(group => {
          group.eachLayer(layer => {
            if (layer instanceof L.GeoJSON && 
                layer.feature && 
                'id' in layer.feature && 
                layer.feature.id === featureId) {
              group.removeLayer(layer);
            }
          });
        });
      },

      styleFeature: (featureId, style) => {
        Object.values(layerGroups.current).forEach(group => {
          group.eachLayer(layer => {
            if (layer instanceof L.GeoJSON && 
                layer.feature && 
                'id' in layer.feature && 
                layer.feature.id === featureId) {
              layer.setStyle(style);
            }
          });
        });
      },

      measure: (type, features) => {
        if (type === 'distance') {
          const coordinates = features.flatMap(f => 
            f.geometry.type === 'Point' ? [f.geometry.coordinates as [number, number]] : []
          );
          const line = lineString(coordinates);
          return length(line);
        } else {
          const coordinates = features.flatMap(f => 
            f.geometry.type === 'Point' ? [f.geometry.coordinates as [number, number]] : []
          );
          const poly = polygon([coordinates]);
          return area(poly);
        }
      },

      buffer: (feature, distance, units) => {
        try {
          const buffered = buffer(feature, distance, units);
          if (!buffered) return feature;
          return buffered as Feature<Geometry, GeoJsonProperties>;
        } catch (error) {
          console.error('Buffer operation failed:', error);
          return feature;
        }
      }
    };

    onMapReady(methods);
  }, [map, onMapReady]);

  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({ onMapReady }) => {
  const [mapState, setMapState] = useState<MapState>({
    layers: [],
    mode: 'view'
  });

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LayersControl position="topright">
          {mapState.layers.map(layer => (
            <LayersControl.Overlay 
              key={layer.id} 
              name={layer.name} 
              checked={layer.visible}
            >
              <FeatureGroup>
                {/* Layer features will be added here dynamically */}
              </FeatureGroup>
            </LayersControl.Overlay>
          ))}
        </LayersControl>
        <MapController onMapReady={onMapReady} />
      </MapContainer>
    </div>
  );
};
