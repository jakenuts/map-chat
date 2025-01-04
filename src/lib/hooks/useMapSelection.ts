import { useState, useCallback } from 'react';
import L from 'leaflet';
import { GeoJSONFeature, FeatureId } from '../types';
import { logMessage } from '../utils/logging';

interface UseMapSelectionProps {
  map: L.Map | null;
  onSelect?: (features: GeoJSONFeature[]) => void;
  multiSelect?: boolean;
}

export const useMapSelection = ({ 
  map, 
  onSelect,
  multiSelect = false 
}: UseMapSelectionProps) => {
  const [selectedFeatures, setSelectedFeatures] = useState<GeoJSONFeature[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const clearSelection = useCallback(() => {
    setSelectedFeatures([]);
    logMessage('map_command', { type: 'selection_cleared' });
  }, []);

  const startSelection = useCallback(() => {
    if (!map) return;

    setIsSelecting(true);
    if (!multiSelect) {
      clearSelection();
    }

    // Add selection cursor style
    map.getContainer().style.cursor = 'crosshair';
    logMessage('map_command', { type: 'selection_started' });
  }, [map, multiSelect, clearSelection]);

  const stopSelection = useCallback(() => {
    if (!map) return;

    setIsSelecting(false);
    // Restore default cursor
    map.getContainer().style.cursor = '';
    logMessage('map_command', { type: 'selection_stopped' });
  }, [map]);

  const handleFeatureClick = useCallback((feature: GeoJSONFeature) => {
    if (!isSelecting) return;

    setSelectedFeatures(prev => {
      const featureIndex = prev.findIndex(f => f.id === feature.id);
      let newSelection: GeoJSONFeature[];

      if (featureIndex >= 0) {
        // Deselect if already selected
        newSelection = prev.filter(f => f.id !== feature.id);
      } else {
        // Add to selection
        newSelection = multiSelect ? [...prev, feature] : [feature];
      }

      logMessage('map_command', { 
        type: 'feature_selected',
        featureId: feature.id,
        totalSelected: newSelection.length
      });

      onSelect?.(newSelection);
      return newSelection;
    });
  }, [isSelecting, multiSelect, onSelect]);

  const isFeatureSelected = useCallback((featureId: FeatureId) => {
    return selectedFeatures.some(f => f.id === featureId);
  }, [selectedFeatures]);

  const getSelectionStyle = useCallback((selected: boolean): L.PathOptions => {
    return selected ? {
      color: '#2563eb',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.3,
      fillColor: '#3b82f6'
    } : {
      color: '#6b7280',
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.2,
      fillColor: '#9ca3af'
    };
  }, []);

  return {
    selectedFeatures,
    isSelecting,
    startSelection,
    stopSelection,
    clearSelection,
    handleFeatureClick,
    isFeatureSelected,
    getSelectionStyle
  };
};
