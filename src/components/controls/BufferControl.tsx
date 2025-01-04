import React, { useState } from 'react';
import { GeoJSONFeature } from '../../lib/types';
import { logMessage } from '../../lib/utils/logging';

interface BufferControlProps {
  onBufferCreate: (distance: number, units: 'kilometers' | 'miles' | 'meters') => void;
  selectedFeature?: GeoJSONFeature;
  isActive: boolean;
  onClose: () => void;
}

type UnitOption = {
  value: 'kilometers' | 'miles' | 'meters';
  label: string;
  multiplier: number;
};

const UNIT_OPTIONS: UnitOption[] = [
  { value: 'meters', label: 'Meters', multiplier: 1 },
  { value: 'kilometers', label: 'Kilometers', multiplier: 1000 },
  { value: 'miles', label: 'Miles', multiplier: 1609.34 }
];

export const BufferControl: React.FC<BufferControlProps> = ({
  onBufferCreate,
  selectedFeature,
  isActive,
  onClose
}) => {
  const [distance, setDistance] = useState<number>(1);
  const [units, setUnits] = useState<UnitOption>(UNIT_OPTIONS[0]);

  const handleDistanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setDistance(value);
      logMessage('map_command', { 
        type: 'buffer_distance_change', 
        distance: value,
        units: units.value 
      });
    }
  };

  const handleUnitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUnit = UNIT_OPTIONS.find(u => u.value === event.target.value);
    if (selectedUnit) {
      setUnits(selectedUnit);
      logMessage('map_command', { 
        type: 'buffer_unit_change', 
        units: selectedUnit.value 
      });
    }
  };

  const handleCreateBuffer = () => {
    onBufferCreate(distance, units.value);
    logMessage('map_command', { 
      type: 'create_buffer', 
      distance,
      units: units.value,
      feature: selectedFeature?.id 
    });
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md w-64">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Create Buffer</h3>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {selectedFeature ? (
          <>
            <div className="flex flex-col space-y-2">
              <label className="text-sm text-gray-600">Distance</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={distance}
                  onChange={handleDistanceChange}
                  className="flex-1 px-2 py-1 border rounded"
                />
                <select
                  value={units.value}
                  onChange={handleUnitChange}
                  className="px-2 py-1 border rounded bg-white"
                >
                  {UNIT_OPTIONS.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleCreateBuffer}
            >
              Create Buffer
            </button>
          </>
        ) : (
          <div className="text-sm text-gray-600">
            Select a feature to create a buffer
          </div>
        )}
      </div>
    </div>
  );
};
