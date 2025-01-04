import { useState, useCallback } from 'react';
import { GeoJSONFeature } from '../types';
import { logMessage } from '../utils/logging';

export type MapMode = 'measure' | 'buffer' | 'default';
export type MeasureType = 'distance' | 'area';

interface MapModeState {
  mode: MapMode;
  measureType?: MeasureType;
  selectedFeatures: GeoJSONFeature[];
  measureResult: number | null;
  showLayerPanel: boolean;
}

interface UseMapModeProps {
  onModeChange?: (mode: MapMode) => void;
  onMeasureComplete?: (result: number) => void;
  onBufferCreate?: (feature: GeoJSONFeature) => void;
}

export const useMapMode = ({
  onModeChange,
  onMeasureComplete,
  onBufferCreate
}: UseMapModeProps = {}) => {
  const [state, setState] = useState<MapModeState>({
    mode: 'default',
    selectedFeatures: [],
    measureResult: null,
    showLayerPanel: false
  });

  const setMode = useCallback((mode: MapMode) => {
    setState(prev => ({
      ...prev,
      mode,
      measureType: undefined,
      measureResult: null
    }));
    onModeChange?.(mode);
    logMessage('map_command', { type: 'mode_change', mode });
  }, [onModeChange]);

  const startMeasurement = useCallback((type: MeasureType) => {
    setState(prev => ({
      ...prev,
      mode: 'measure',
      measureType: type,
      measureResult: null
    }));
    logMessage('map_command', { 
      type: 'measurement_started', 
      measureType: type 
    });
  }, []);

  const completeMeasurement = useCallback((result: number) => {
    setState(prev => ({
      ...prev,
      measureResult: result
    }));
    onMeasureComplete?.(result);
    logMessage('map_command', { 
      type: 'measurement_complete', 
      result 
    });
  }, [onMeasureComplete]);

  const startBuffer = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'buffer',
      selectedFeatures: []
    }));
    logMessage('map_command', { type: 'buffer_started' });
  }, []);

  const createBuffer = useCallback((feature: GeoJSONFeature) => {
    onBufferCreate?.(feature);
    setMode('default');
    logMessage('map_command', { 
      type: 'buffer_created', 
      featureId: feature.id 
    });
  }, [onBufferCreate, setMode]);

  const toggleLayerPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      showLayerPanel: !prev.showLayerPanel
    }));
    logMessage('map_command', { 
      type: 'layer_panel_toggle', 
      visible: !state.showLayerPanel 
    });
  }, [state.showLayerPanel]);

  const cancelOperation = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'default',
      measureType: undefined,
      measureResult: null,
      selectedFeatures: []
    }));
    logMessage('map_command', { type: 'operation_cancelled' });
  }, []);

  const updateSelectedFeatures = useCallback((features: GeoJSONFeature[]) => {
    setState(prev => ({
      ...prev,
      selectedFeatures: features
    }));
    logMessage('map_command', { 
      type: 'features_selected', 
      count: features.length 
    });
  }, []);

  return {
    mode: state.mode,
    measureType: state.measureType,
    selectedFeatures: state.selectedFeatures,
    measureResult: state.measureResult,
    showLayerPanel: state.showLayerPanel,
    setMode,
    startMeasurement,
    completeMeasurement,
    startBuffer,
    createBuffer,
    toggleLayerPanel,
    cancelOperation,
    updateSelectedFeatures
  };
};
