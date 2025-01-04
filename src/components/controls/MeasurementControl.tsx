import React, { useState } from 'react';
import { GeoJSONFeature } from '../../lib/types';
import { logMessage } from '../../lib/utils/logging';

interface MeasurementControlProps {
  onMeasureStart: (type: 'distance' | 'area') => void;
  onMeasureEnd: () => void;
  isActive: boolean;
  onMeasure?: (type: 'distance' | 'area', features: GeoJSONFeature[]) => number;
  selectedFeatures?: GeoJSONFeature[];
}

export const MeasurementControl: React.FC<MeasurementControlProps> = ({
  onMeasureStart,
  onMeasureEnd,
  isActive,
  onMeasure,
  selectedFeatures = []
}) => {
  const [measureType, setMeasureType] = useState<'distance' | 'area'>('distance');
  const [result, setResult] = useState<number | null>(null);

  const handleModeChange = (type: 'distance' | 'area') => {
    setMeasureType(type);
    setResult(null);
    if (isActive) {
      onMeasureEnd();
    }
    onMeasureStart(type);
    logMessage('map_command', { type: 'measure_mode_change', measureType: type });
  };

  const handleMeasure = () => {
    if (onMeasure && selectedFeatures.length > 0) {
      const measureResult = onMeasure(measureType, selectedFeatures);
      setResult(measureResult);
      logMessage('map_command', { 
        type: 'measure_result', 
        measureType, 
        result: measureResult 
      });
    }
  };

  const formatResult = (value: number): string => {
    if (measureType === 'distance') {
      return `${value.toFixed(2)} km`;
    } else {
      return `${value.toFixed(2)} km²`;
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-col space-y-4">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded ${
              measureType === 'distance' && isActive
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
            onClick={() => handleModeChange('distance')}
          >
            Distance
          </button>
          <button
            className={`px-4 py-2 rounded ${
              measureType === 'area' && isActive
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
            onClick={() => handleModeChange('area')}
          >
            Area
          </button>
        </div>

        {isActive && (
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-gray-600">
              {measureType === 'distance'
                ? 'Select two or more points to measure distance'
                : 'Select a polygon to measure area'}
            </div>
            <div className="flex justify-between items-center">
              <button
                className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
                onClick={handleMeasure}
                disabled={selectedFeatures.length === 0}
              >
                Measure
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded"
                onClick={onMeasureEnd}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {result !== null && (
          <div className="text-center p-2 bg-gray-100 rounded">
            <span className="font-bold">{formatResult(result)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
