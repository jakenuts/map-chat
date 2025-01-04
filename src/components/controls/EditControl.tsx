import React from 'react';
import { GeoJSONFeature } from '../../lib/types';
import { EditMode } from '../../lib/hooks/useFeatureEdit';
import { logMessage } from '../../lib/utils/logging';

interface EditControlProps {
  isActive: boolean;
  mode: EditMode;
  selectedFeature?: GeoJSONFeature;
  selectedVertex: number | null;
  onStartVertexEdit: () => void;
  onStartSplitMode: () => void;
  onStartMergeMode: () => void;
  onCancel: () => void;
  onVertexSelect: (index: number | null) => void;
}

export const EditControl: React.FC<EditControlProps> = ({
  isActive,
  mode,
  selectedFeature,
  selectedVertex,
  onStartVertexEdit,
  onStartSplitMode,
  onStartMergeMode,
  onCancel,
  onVertexSelect
}) => {
  if (!isActive) return null;

  const handleModeChange = (newMode: EditMode) => {
    switch (newMode) {
      case 'vertex':
        onStartVertexEdit();
        break;
      case 'split':
        onStartSplitMode();
        break;
      case 'merge':
        onStartMergeMode();
        break;
      default:
        onCancel();
    }
    logMessage('map_command', { type: 'edit_mode_change', mode: newMode });
  };

  return (
    <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md w-64">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Edit Feature</h3>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>

        {selectedFeature ? (
          <>
            <div className="flex flex-col space-y-2">
              <div className="text-sm text-gray-600">
                Select an edit mode:
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className={`px-3 py-2 rounded text-sm ${
                    mode === 'vertex'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => handleModeChange('vertex')}
                >
                  Vertex
                </button>
                <button
                  className={`px-3 py-2 rounded text-sm ${
                    mode === 'split'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => handleModeChange('split')}
                >
                  Split
                </button>
                <button
                  className={`px-3 py-2 rounded text-sm ${
                    mode === 'merge'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => handleModeChange('merge')}
                >
                  Merge
                </button>
              </div>
            </div>

            {mode === 'vertex' && (
              <div className="flex flex-col space-y-2">
                <div className="text-sm text-gray-600">
                  {selectedVertex !== null
                    ? 'Click and drag to move the vertex'
                    : 'Click a vertex to select it'}
                </div>
                {selectedVertex !== null && (
                  <button
                    className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    onClick={() => onVertexSelect(null)}
                  >
                    Cancel Vertex Selection
                  </button>
                )}
              </div>
            )}

            {mode === 'split' && (
              <div className="text-sm text-gray-600">
                Click on the feature where you want to split it
              </div>
            )}

            {mode === 'merge' && (
              <div className="text-sm text-gray-600">
                Select another feature to merge with this one
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-600">
            Select a feature to edit
          </div>
        )}
      </div>
    </div>
  );
};
