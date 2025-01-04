import React, { useState } from 'react';
import { LayerGroup, Layer } from '../../lib/types';
import { logMessage } from '../../lib/utils/logging';

interface LayerControlProps {
  layers: LayerGroup[];
  onLayerToggle: (layerId: string, visible: boolean) => void;
  onLayerStyle: (layerId: string, style: L.PathOptions) => void;
  activeLayerId?: string;
}

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => (
  <div className="flex items-center space-x-2">
    <label className="text-sm text-gray-600">{label}</label>
    <input
      type="color"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      className="w-8 h-8 rounded cursor-pointer"
    />
  </div>
);

export const LayerControl: React.FC<LayerControlProps> = ({
  layers,
  onLayerToggle,
  onLayerStyle,
  activeLayerId
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingLayer, setEditingLayer] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleStyleChange = (layerId: string, style: Partial<L.PathOptions>) => {
    const layer = layers
      .flatMap(g => g.layers)
      .find(l => l.id === layerId);
    
    if (layer) {
      const newStyle = { ...layer.style, ...style };
      onLayerStyle(layerId, newStyle);
      logMessage('map_command', { 
        type: 'layer_style_change', 
        layerId,
        style: newStyle 
      });
    }
  };

  const renderLayer = (layer: Layer) => {
    const isEditing = editingLayer === layer.id;

    return (
      <div
        key={layer.id}
        className={`pl-4 py-1 ${
          activeLayerId === layer.id ? 'bg-blue-50' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={(e) => {
                onLayerToggle(layer.id, e.target.checked);
                logMessage('map_command', { 
                  type: 'layer_visibility_change', 
                  layerId: layer.id,
                  visible: e.target.checked 
                });
              }}
              className="form-checkbox"
            />
            <span className="text-sm">{layer.name}</span>
          </div>
          <button
            onClick={() => setEditingLayer(isEditing ? null : layer.id)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isEditing ? '✕' : '⚙️'}
          </button>
        </div>

        {isEditing && (
          <div className="mt-2 pl-6 space-y-2">
            <ColorPicker
              label="Fill Color"
              color={layer.style?.fillColor || '#3388ff'}
              onChange={(color) => handleStyleChange(layer.id, { fillColor: color })}
            />
            <ColorPicker
              label="Stroke Color"
              color={layer.style?.color || '#3388ff'}
              onChange={(color) => handleStyleChange(layer.id, { color })}
            />
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={layer.style?.opacity || 1}
                onChange={(e) => handleStyleChange(layer.id, { 
                  opacity: parseFloat(e.target.value) 
                })}
                className="w-24"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Weight</label>
              <input
                type="number"
                min="1"
                max="10"
                value={layer.style?.weight || 3}
                onChange={(e) => handleStyleChange(layer.id, { 
                  weight: parseInt(e.target.value) 
                })}
                className="w-16 px-2 py-1 border rounded"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-md w-72 max-h-[80vh] overflow-y-auto">
      <h3 className="font-bold text-lg mb-4">Layers</h3>
      <div className="space-y-2">
        {layers.map((group) => (
          <div key={group.id} className="border rounded">
            <div
              className="flex items-center justify-between p-2 bg-gray-50 cursor-pointer"
              onClick={() => toggleGroup(group.id)}
            >
              <span className="font-medium">{group.name}</span>
              <span>{expandedGroups.has(group.id) ? '▼' : '▶'}</span>
            </div>
            {expandedGroups.has(group.id) && (
              <div className="py-1">
                {group.layers.map(renderLayer)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
