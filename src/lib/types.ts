import { Feature, Geometry } from 'geojson';

// Map Command Types
export type CommandType = 
  | 'zoom_to'
  | 'add_feature'
  | 'modify_feature'
  | 'remove_feature'
  | 'style_feature'
  | 'measure'
  | 'buffer';

export interface BaseCommand {
  type: CommandType;
  parameters: Record<string, any>;
}

export interface ZoomToCommand extends BaseCommand {
  type: 'zoom_to';
  parameters: {
    coordinates: [number, number];
    zoom?: number;
  };
}

// Extend the GeoJSON Feature type to ensure consistent ID handling
export type FeatureId = string | number;
export interface GeoJSONFeature extends Omit<Feature, 'id'> {
  id?: FeatureId;
  properties: Record<string, any>;
}

export interface AddFeatureCommand extends BaseCommand {
  type: 'add_feature';
  parameters: {
    feature: GeoJSONFeature;
    layerId: string;
    style?: L.PathOptions;
  };
}

export interface ModifyFeatureCommand extends BaseCommand {
  type: 'modify_feature';
  parameters: {
    featureId: FeatureId;
    properties: Record<string, any>;
  };
}

export interface RemoveFeatureCommand extends BaseCommand {
  type: 'remove_feature';
  parameters: {
    featureId: FeatureId;
    layerId: string;
  };
}

export interface StyleFeatureCommand extends BaseCommand {
  type: 'style_feature';
  parameters: {
    featureId: FeatureId;
    style: L.PathOptions;
  };
}

export interface MeasureCommand extends BaseCommand {
  type: 'measure';
  parameters: {
    type: 'distance' | 'area';
    features: GeoJSONFeature[];
  };
}

export interface BufferCommand extends BaseCommand {
  type: 'buffer';
  parameters: {
    feature: GeoJSONFeature;
    distance: number;
    units: 'kilometers' | 'miles' | 'meters';
  };
}

export type MapCommand =
  | ZoomToCommand
  | AddFeatureCommand
  | ModifyFeatureCommand
  | RemoveFeatureCommand
  | StyleFeatureCommand
  | MeasureCommand
  | BufferCommand;

// Map Methods Interface
export interface MapMethods {
  zoomTo(coordinates: [number, number], zoom?: number): void;
  addFeature(feature: GeoJSONFeature, layerId: string, style?: L.PathOptions): void;
  modifyFeature(featureId: FeatureId, properties: Record<string, any>): void;
  removeFeature(featureId: FeatureId, layerId: string): void;
  styleFeature(featureId: FeatureId, style: L.PathOptions): void;
  measure(type: 'distance' | 'area', features: GeoJSONFeature[]): number;
  buffer(feature: GeoJSONFeature, distance: number, units: 'kilometers' | 'miles' | 'meters'): GeoJSONFeature;
}

// Layer Management Types
export interface Layer {
  id: string;
  name: string;
  type: 'feature' | 'marker' | 'polygon' | 'line';
  visible: boolean;
  features: GeoJSONFeature[];
  style?: L.PathOptions;
}

export interface LayerGroup {
  id: string;
  name: string;
  layers: Layer[];
  visible: boolean;
}

// Map State Types
export interface MapState {
  center: [number, number];
  zoom: number;
  layers: LayerGroup[];
  activeLayerId?: string;
  selectedFeatureId?: FeatureId;
  history?: {
    undoStack: any[];
    redoStack: any[];
  };
  selection?: {
    selectedFeatures: string[];
    activeLayerId?: string;
  };
  view?: {
    center: [number, number];
    zoom: number;
  };
}
