import { Feature, Geometry, GeoJsonProperties } from 'geojson';
import { GeoJSONFeature, FeatureId } from '../types';

export const ensureFeatureProperties = (properties: GeoJsonProperties): Record<string, any> => {
  return properties || {};
};

export const toGeoJSONFeature = (feature: Feature<Geometry, GeoJsonProperties>): GeoJSONFeature => {
  return {
    type: feature.type,
    geometry: feature.geometry,
    properties: ensureFeatureProperties(feature.properties),
    id: feature.id as FeatureId | undefined
  };
};

export const fromGeoJSONFeature = (feature: GeoJSONFeature): Feature<Geometry, GeoJsonProperties> => {
  return {
    type: feature.type,
    geometry: feature.geometry,
    properties: feature.properties,
    ...(feature.id && { id: feature.id })
  };
};
