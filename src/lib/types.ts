import { PathOptions } from 'leaflet';
import { GeoJSON } from 'geojson';

export type MapCommandType = 
  | 'zoom_to' 
  | 'add_feature' 
  | 'modify_feature' 
  | 'remove_feature' 
  | 'style_feature'
  | 'measure'
  | 'buffer';

export interface MapCommand {
  type: MapCommandType;
  parameters: Record<string, any>;
}

export interface ZoomToCommand extends MapCommand {
  type: 'zoom_to';
  parameters: {
    coordinates: [number, number];
    zoom?: number;
  };
}

export interface AddFeatureCommand extends MapCommand {
  type: 'add_feature';
  parameters: {
    feature: GeoJSON.Feature;
    layerId?: string;
    style?: PathOptions;
  };
}

export interface ModifyFeatureCommand extends MapCommand {
  type: 'modify_feature';
  parameters: {
    featureId: string;
    properties: Record<string, any>;
  };
}

export interface RemoveFeatureCommand extends MapCommand {
  type: 'remove_feature';
  parameters: {
    featureId: string;
    layerId?: string;
  };
}

export interface StyleFeatureCommand extends MapCommand {
  type: 'style_feature';
  parameters: {
    featureId: string;
    style: PathOptions;
  };
}

export interface MeasureCommand extends MapCommand {
  type: 'measure';
  parameters: {
    type: 'distance' | 'area';
    features: GeoJSON.Feature[];
  };
}

export interface BufferCommand extends MapCommand {
  type: 'buffer';
  parameters: {
    feature: GeoJSON.Feature;
    distance: number;
    units: 'kilometers' | 'miles' | 'meters';
  };
}

export interface MapMethods {
  zoomTo(coordinates: [number, number], zoom?: number): void;
  addFeature(feature: GeoJSON.Feature, layerId?: string, style?: PathOptions): void;
  modifyFeature(featureId: string, properties: Record<string, any>): void;
  removeFeature(featureId: string, layerId?: string): void;
  styleFeature(featureId: string, style: PathOptions): void;
  measure(type: 'distance' | 'area', features: GeoJSON.Feature[]): number;
  buffer(feature: GeoJSON.Feature, distance: number, units: 'kilometers' | 'miles' | 'meters'): GeoJSON.Feature;
}

export interface Layer {
  id: string;
  name: string;
  type: 'feature' | 'marker' | 'vector';
  visible: boolean;
  features: GeoJSON.Feature[];
  style?: PathOptions;
}

export interface MapState {
  layers: Layer[];
  selectedFeature?: string;
  selectedLayer?: string;
  mode: 'view' | 'edit' | 'measure' | 'draw';
}
