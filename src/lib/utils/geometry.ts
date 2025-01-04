import { Position, LineString, Polygon, Feature } from 'geojson';
import { GeoJSONFeature } from '../types';

export type EditableGeometry = LineString | Polygon;
export type EditableFeature = GeoJSONFeature & { geometry: EditableGeometry };

export const isEditableFeature = (feature: GeoJSONFeature): feature is EditableFeature => {
  return feature.geometry.type === 'LineString' || feature.geometry.type === 'Polygon';
};

export const getFeatureCoordinates = (feature: EditableFeature): Position[] => {
  return feature.geometry.type === 'LineString'
    ? feature.geometry.coordinates
    : feature.geometry.coordinates[0];
};

export const createLineString = (coordinates: Position[]): LineString => ({
  type: 'LineString',
  coordinates
});

export const createPolygon = (coordinates: Position[]): Polygon => ({
  type: 'Polygon',
  coordinates: [coordinates]
});

export const updateFeatureGeometry = (
  feature: EditableFeature,
  coordinates: Position[]
): EditableFeature => {
  return {
    ...feature,
    geometry: feature.geometry.type === 'LineString'
      ? createLineString(coordinates)
      : createPolygon(coordinates)
  };
};
