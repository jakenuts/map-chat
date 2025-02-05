import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapMethods, MapState, Layer, GeoJSONFeature, FeatureId } from '../lib/types';
import { LayerService } from '../lib/services/layer';
import { SpatialService } from '../lib/services/spatial';
import { logMessage } from '../lib/utils/logging';
import { toGeoJSONFeature, fromGeoJSONFeature } from '../lib/utils/geo';
import { Feature, Geometry } from 'geojson';
import { useMapMode } from '../lib/hooks/useMapMode';
import { useMapSelection } from '../lib/hooks/useMapSelection';
import { useMapHistory } from '../lib/hooks/useMapHistory';
import { useMapShortcuts } from '../lib/hooks/useMapShortcuts';
import { useHistoryShortcuts } from '../lib/hooks/useHistoryShortcuts';
import { useMapPersistence } from '../lib/hooks/useMapPersistence';
import { withErrorBoundary } from './ErrorBoundary';
import { withLoading } from './LoadingState';
import { MeasurementControl } from './controls/MeasurementControl';
import { BufferControl } from './controls/BufferControl';
import { LayerControl } from './controls/LayerControl';
import { LoggingControl } from './controls/LoggingControl';

interface MapComponentProps {
  onMapMethods?: (methods: MapMethods) => void;
  initialState?: Partial<MapState>;
  isLoading?: boolean;
  loadingMessage?: string;
}

const MapComponentBase: React.FC<MapComponentProps> = ({
  onMapMethods,
  initialState,
  isLoading = false
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [state, setState] = useState<MapState>({
    center: initialState?.center || [0, 0],
    zoom: initialState?.zoom || 2,
    layers: initialState?.layers || []
  });

  const layerServiceRef = useRef<LayerService>(new LayerService(initialState));
  const spatialServiceRef = useRef<SpatialService>(new SpatialService());
  const [layerGroups, setLayerGroups] = useState<Record<string, L.LayerGroup>>({});

  // Handle errors
  const handleError = useCallback((error: Error) => {
    logMessage('error', {
      type: 'map_error',
      error: error.message
    });
  }, []);

  // Handle undo/redo
  const handleUndo = useCallback((operation: any) => {
    logMessage('map_command', { type: 'undo', operation });
  }, []);

  const handleRedo = useCallback((operation: any) => {
    logMessage('map_command', { type: 'redo', operation });
  }, []);

  // Initialize services and hooks with stable references
  const {
    mode,
    selectedFeatures,
    startMeasurement,
    startBuffer,
    cancelOperation,
    updateSelectedFeatures
  } = useMapMode();

  const stableUpdateSelectedFeatures = useCallback(updateSelectedFeatures, [updateSelectedFeatures]);

  useMapSelection({
    map: mapRef.current,
    onSelect: stableUpdateSelectedFeatures
  });

  const {
    undo,
    redo,
    recordCreate,
    recordModify,
    recordDelete,
    recordStyle
  } = useMapHistory({
    onUndo: handleUndo,
    onRedo: handleRedo
  });

  useMapShortcuts({
    onMeasure: () => startMeasurement('distance'),
    onBuffer: startBuffer,
    onCancel: cancelOperation
  });

  useHistoryShortcuts({
    onUndo: undo,
    onRedo: redo
  });

  const {
    saveState,
    loadState,
    setupAutoSave
  } = useMapPersistence({
    onStateLoad: setState,
    onStateError: handleError
  });

  // Initialize map only once
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
  }, []); // Empty dependency array - only run once on mount

  // Load saved state
  useEffect(() => {
    const savedState = loadState();
    if (savedState) {
      setState(savedState);
    }
  }, [loadState]); // Only depends on loadState function

  // Update map view when state changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(state.center, state.zoom);
    }
  }, [state.center, state.zoom]);

  // Setup auto-save with debounce
  useEffect(() => {
    const cleanup = setupAutoSave(() => ({
      center: state.center,
      zoom: state.zoom,
      layers: state.layers,
      activeLayerId: state.activeLayerId
    }));
    return () => {
      if (cleanup) cleanup();
    };
  }, [setupAutoSave]); // Remove state from dependencies

  // Define stable map methods with useCallback
  const mapMethods = useCallback((): MapMethods => {
    if (!mapRef.current) return {} as MapMethods;
    
    return {
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
          const geoJsonLayer = L.geoJSON(geoJsonFeature, { style });
          layerGroup.addLayer(geoJsonLayer);
          layerServiceRef.current.addFeatureToLayer(layerId, geoJsonFeature);
          recordCreate(layerId, feature);
          logMessage('map_command', { type: 'add_feature', layerId, feature });
        },

        modifyFeature: (featureId: FeatureId, properties: Record<string, any>) => {
          const feature = layerServiceRef.current.getFeatureById(featureId);
          if (feature) {
            const previousState = { ...feature.properties };
            feature.properties = { ...feature.properties, ...properties };
            recordModify(feature.id as string, feature, previousState, feature.properties);
            logMessage('map_command', { type: 'modify_feature', featureId, properties });
          }
        },

        removeFeature: (featureId: FeatureId, layerId: string) => {
          const feature = layerServiceRef.current.getFeatureById(featureId);
          if (feature) {
            recordDelete(layerId, feature);
            layerServiceRef.current.removeFeature(layerId, featureId);
            logMessage('map_command', { type: 'remove_feature', layerId, featureId });
          }
        },

        styleFeature: (featureId: FeatureId, style: L.PathOptions) => {
          const feature = layerServiceRef.current.getFeatureById(featureId);
          if (feature) {
            recordStyle(feature.id as string, feature, feature.properties.style || {}, style);
            feature.properties.style = style;
            logMessage('map_command', { type: 'style_feature', featureId, style });
          }
        },

        measure: (type: 'distance' | 'area', features: GeoJSONFeature[]): number => {
          if (type === 'distance') {
            return spatialServiceRef.current.calculateDistance(features);
          } else {
            return spatialServiceRef.current.calculateArea(features);
          }
        },

        buffer: (feature: GeoJSONFeature, distance: number, units: 'kilometers' | 'miles' | 'meters'): GeoJSONFeature => {
          return spatialServiceRef.current.createBuffer(feature, distance, units);
        }
      };

  }, [recordCreate, recordModify, recordDelete, recordStyle]);

  // Expose map methods with debounce
  useEffect(() => {
    if (!mapRef.current || !onMapMethods) return;

    const timeoutId = setTimeout(() => {
      onMapMethods(mapMethods());
    }, 100); // Debounce map method updates

    return () => clearTimeout(timeoutId);
  }, [onMapMethods, mapMethods]);

  return (
    <div className="relative h-full">
      <div id="map" className="h-full w-full" />
      
      {mode === 'measure' && (
        <MeasurementControl
          onMeasureStart={startMeasurement}
          onMeasureEnd={cancelOperation}
          isActive={mode === 'measure'}
          selectedFeatures={selectedFeatures}
        />
      )}

      {mode === 'buffer' && (
        <BufferControl
          onBufferCreate={(distance, units) => {
            if (selectedFeatures[0]) {
              const buffered = spatialServiceRef.current.createBuffer(
                selectedFeatures[0],
                distance,
                units
              );
              recordCreate('buffers', buffered);
            }
          }}
          selectedFeature={selectedFeatures[0]}
          isActive={mode === 'buffer'}
          onClose={cancelOperation}
        />
      )}

      <LayerControl
        layers={state.layers}
        onLayerToggle={(layerId, visible) => {
          layerServiceRef.current.setLayerVisibility(layerId, visible);
        }}
        onLayerStyle={(layerId, style) => {
          layerServiceRef.current.setLayerStyle(layerId, style);
        }}
        activeLayerId={state.activeLayerId}
      />

      <LoggingControl />
    </div>
  );
};

// Export wrapped component with error boundary and loading state
export const MapComponent = withErrorBoundary(
  withLoading(MapComponentBase)
);
