import { Layer, LayerGroup, MapState, GeoJSONFeature } from '../types';
import { logMessage } from '../utils/logging';
import { toGeoJSONFeature } from '../utils/geo';
import { v4 as uuidv4 } from 'uuid';
import { Feature, Geometry, GeoJsonProperties } from 'geojson';

export class LayerService {
  private state: MapState;

  constructor(initialState?: Partial<MapState>) {
    this.state = {
      center: [0, 0],
      zoom: 2,
      layers: [],
      ...initialState
    };
  }

  getState(): MapState {
    return { ...this.state };
  }

  createLayerGroup(name: string): LayerGroup {
    const group: LayerGroup = {
      id: uuidv4(),
      name,
      layers: [],
      visible: true
    };

    this.state.layers.push(group);
    logMessage('map_command', { type: 'create_layer_group', name });
    return group;
  }

  createLayer(groupId: string, name: string, type: Layer['type']): Layer | null {
    const group = this.state.layers.find(g => g.id === groupId);
    if (!group) {
      logMessage('error', { type: 'layer_error', message: `Group ${groupId} not found` });
      return null;
    }

    const layer: Layer = {
      id: uuidv4(),
      name,
      type,
      visible: true,
      features: []
    };

    group.layers.push(layer);
    logMessage('map_command', { type: 'create_layer', groupId, name, layerType: type });
    return layer;
  }

  addFeatureToLayer(layerId: string, feature: Feature<Geometry, GeoJsonProperties>): boolean {
    for (const group of this.state.layers) {
      const layer = group.layers.find(l => l.id === layerId);
      if (layer) {
        const geoJSONFeature = toGeoJSONFeature(feature);
        if (!geoJSONFeature.id) {
          geoJSONFeature.id = uuidv4();
        }
        layer.features.push(geoJSONFeature);
        logMessage('map_command', { 
          type: 'add_feature', 
          layerId, 
          featureId: geoJSONFeature.id 
        });
        return true;
      }
    }
    logMessage('error', { type: 'layer_error', message: `Layer ${layerId} not found` });
    return false;
  }

  removeFeature(layerId: string, featureId: string | number): boolean {
    for (const group of this.state.layers) {
      const layer = group.layers.find(l => l.id === layerId);
      if (layer) {
        const index = layer.features.findIndex(f => f.id === featureId);
        if (index !== -1) {
          layer.features.splice(index, 1);
          logMessage('map_command', { type: 'remove_feature', layerId, featureId });
          return true;
        }
      }
    }
    logMessage('error', { type: 'layer_error', message: `Feature or layer not found` });
    return false;
  }

  modifyFeature(layerId: string, featureId: string | number, properties: Record<string, any>): boolean {
    for (const group of this.state.layers) {
      const layer = group.layers.find(l => l.id === layerId);
      if (layer) {
        const feature = layer.features.find(f => f.id === featureId);
        if (feature) {
          feature.properties = {
            ...feature.properties,
            ...properties
          };
          logMessage('map_command', { 
            type: 'modify_feature', 
            layerId, 
            featureId,
            properties 
          });
          return true;
        }
      }
    }
    logMessage('error', { type: 'layer_error', message: `Feature or layer not found` });
    return false;
  }

  setLayerVisibility(layerId: string, visible: boolean): boolean {
    for (const group of this.state.layers) {
      const layer = group.layers.find(l => l.id === layerId);
      if (layer) {
        layer.visible = visible;
        logMessage('map_command', { type: 'set_layer_visibility', layerId, visible });
        return true;
      }
    }
    logMessage('error', { type: 'layer_error', message: `Layer ${layerId} not found` });
    return false;
  }

  setLayerStyle(layerId: string, style: L.PathOptions): boolean {
    for (const group of this.state.layers) {
      const layer = group.layers.find(l => l.id === layerId);
      if (layer) {
        layer.style = style;
        logMessage('map_command', { type: 'set_layer_style', layerId, style });
        return true;
      }
    }
    logMessage('error', { type: 'layer_error', message: `Layer ${layerId} not found` });
    return false;
  }

  getFeatureById(featureId: string | number): GeoJSONFeature | null {
    for (const group of this.state.layers) {
      for (const layer of group.layers) {
        const feature = layer.features.find(f => f.id === featureId);
        if (feature) {
          return feature;
        }
      }
    }
    return null;
  }

  getLayerById(layerId: string): Layer | null {
    for (const group of this.state.layers) {
      const layer = group.layers.find(l => l.id === layerId);
      if (layer) {
        return layer;
      }
    }
    return null;
  }
}
