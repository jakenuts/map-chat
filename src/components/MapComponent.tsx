import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapMethods, MapState, Layer, GeoJSONFeature, FeatureId } from '../lib/types';
import { LayerService } from '../lib/services/layer';
import { logMessage } from '../lib/utils/logging';
import { toGeoJSONFeature, fromGeoJSONFeature } from '../lib/utils/geo';
import { Feature, Geometry } from 'geojson';

interface MapComponentProps {
  onMapMethods?: (methods: MapMethods) => void;
  initialState?: Partial<MapState>;
}

type LeafletGeoJSONLayer = L.GeoJSON<any>;

export const MapComponent: React.FC<MapComponentProps> = ({ 
  onMapMethods,
  initialState 
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const layerServiceRef = useRef<LayerService>(new LayerService(initialState));
  const [layerGroups, setLayerGroups] = useState<Record<string, L.LayerGroup>>({});

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map').setView([0, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      mapRef.current = map;

      // Initialize default layer groups
      const defaultGroups = {
        markers: L.layerGroup().addTo(map),
        features: L.layerGroup().addTo(map),
        buffers: L.layerGroup().addTo(map)
      };
      setLayerGroups(defaultGroups);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && onMapMethods) {
      const methods: MapMethods = {
        zoomTo: (coordinates: [number, number], zoom: number = 13) => {
          mapRef.current?.setView(coordinates, zoom);
          logMessage('map_command', { type: 'zoom_to', coordinates, zoom });
        },

        addFeature: (feature: GeoJSONFeature, layerId: string, style?: L.PathOptions) => {
          const layerGroup = layerGroups[layerId];
          if (!layerGroup) {
            logMessage('error', { type: 'layer_error', message: `Layer ${layerId} not found` });
            return;
          }

          const geoJsonFeature = fromGeoJSONFeature(feature);
          const geoJsonLayer = L.geoJSON(geoJsonFeature, { style }) as LeafletGeoJSONLayer;
          layerGroup.addLayer(geoJsonLayer);
          layerServiceRef.current.addFeatureToLayer(layerId, geoJsonFeature);
          logMessage('map_command', { type: 'add_feature', layerId, feature });
        },

        modifyFeature: (featureId: FeatureId, properties: Record<string, any>) => {
          const feature = layerServiceRef.current.getFeatureById(featureId);
          if (feature) {
            feature.properties = { ...feature.properties, ...properties };
            // Refresh the layer to show updated properties
            Object.values(layerGroups).forEach(group => {
              group.eachLayer(layer => {
                if (layer instanceof L.GeoJSON) {
                  const geoJsonLayer = layer as LeafletGeoJSONLayer;
                  const layerFeature = geoJsonLayer.feature as Feature<Geometry>;
                  if (layerFeature?.id === featureId) {
                    geoJsonLayer.setStyle(properties as L.PathOptions);
                  }
                }
              });
            });
            logMessage('map_command', { type: 'modify_feature', featureId, properties });
          }
        },

        removeFeature: (featureId: FeatureId, layerId: string) => {
          const layerGroup = layerGroups[layerId];
          if (layerGroup) {
            layerGroup.eachLayer(layer => {
              if (layer instanceof L.GeoJSON) {
                const geoJsonLayer = layer as LeafletGeoJSONLayer;
                const layerFeature = geoJsonLayer.feature as Feature<Geometry>;
                if (layerFeature?.id === featureId) {
                  layerGroup.removeLayer(layer);
                }
              }
            });
            layerServiceRef.current.removeFeature(layerId, featureId);
            logMessage('map_command', { type: 'remove_feature', layerId, featureId });
          }
        },

        styleFeature: (featureId: FeatureId, style: L.PathOptions) => {
          Object.values(layerGroups).forEach(group => {
            group.eachLayer(layer => {
              if (layer instanceof L.GeoJSON) {
                const geoJsonLayer = layer as LeafletGeoJSONLayer;
                const layerFeature = geoJsonLayer.feature as Feature<Geometry>;
                if (layerFeature?.id === featureId) {
                  geoJsonLayer.setStyle(style);
                }
              }
            });
          });
          logMessage('map_command', { type: 'style_feature', featureId, style });
        },

        measure: (type: 'distance' | 'area', features: GeoJSONFeature[]): number => {
          // TODO: Implement measurement calculations using turf.js
          logMessage('map_command', { type: 'measure', measureType: type, features });
          return 0;
        },

        buffer: (feature: GeoJSONFeature, distance: number, units: 'kilometers' | 'miles' | 'meters'): GeoJSONFeature => {
          // TODO: Implement buffer creation using turf.js
          logMessage('map_command', { type: 'buffer', feature, distance, units });
          return feature;
        }
      };

      onMapMethods(methods);
    }
  }, [onMapMethods, layerGroups]);

  return <div id="map" className="h-full w-full" />;
};
