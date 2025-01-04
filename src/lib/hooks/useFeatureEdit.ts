import { useCallback, useState } from 'react';
import { GeoJSONFeature } from '../types';
import { logMessage } from '../utils/logging';
import * as turf from '@turf/turf';
import { Position } from 'geojson';
import {
  isEditableFeature,
  getFeatureCoordinates,
  updateFeatureGeometry,
  EditableFeature
} from '../utils/geometry';

export type EditMode = 'vertex' | 'split' | 'merge' | 'none';

interface UseFeatureEditProps {
  onFeatureChange?: (feature: GeoJSONFeature) => void;
  onFeatureSplit?: (features: GeoJSONFeature[]) => void;
  onFeatureMerge?: (feature: GeoJSONFeature) => void;
}

export const useFeatureEdit = ({
  onFeatureChange,
  onFeatureSplit,
  onFeatureMerge
}: UseFeatureEditProps = {}) => {
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);

  const startVertexEdit = useCallback(() => {
    setEditMode('vertex');
    logMessage('map_command', { type: 'vertex_edit_started' });
  }, []);

  const startSplitMode = useCallback(() => {
    setEditMode('split');
    logMessage('map_command', { type: 'split_mode_started' });
  }, []);

  const startMergeMode = useCallback(() => {
    setEditMode('merge');
    logMessage('map_command', { type: 'merge_mode_started' });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditMode('none');
    setSelectedVertex(null);
    logMessage('map_command', { type: 'edit_cancelled' });
  }, []);

  const addVertex = useCallback((feature: GeoJSONFeature, coordinates: Position) => {
    try {
      if (!isEditableFeature(feature)) {
        throw new Error('Feature must be a LineString or Polygon');
      }

      const coords = getFeatureCoordinates(feature);
      
      // Find the best position to insert the new vertex
      let insertIndex = 0;
      let minDistance = Infinity;
      
      for (let i = 0; i < coords.length - 1; i++) {
        const line = turf.lineString([coords[i], coords[i + 1]]);
        const point = turf.point(coordinates);
        const distance = turf.pointToLineDistance(point, line);
        
        if (distance < minDistance) {
          minDistance = distance;
          insertIndex = i + 1;
        }
      }

      const newCoords = [...coords];
      newCoords.splice(insertIndex, 0, coordinates);
      const updatedFeature = updateFeatureGeometry(feature, newCoords);

      onFeatureChange?.(updatedFeature);
      logMessage('map_command', { 
        type: 'vertex_added',
        coordinates,
        featureId: feature.id
      });

      return updatedFeature;
    } catch (error) {
      logMessage('error', {
        type: 'vertex_add_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return feature;
    }
  }, [onFeatureChange]);

  const removeVertex = useCallback((feature: GeoJSONFeature, index: number) => {
    try {
      if (!isEditableFeature(feature)) {
        throw new Error('Feature must be a LineString or Polygon');
      }

      const coords = getFeatureCoordinates(feature);
      if (coords.length <= 3) {
        throw new Error('Cannot remove vertex from feature with less than 3 vertices');
      }

      const newCoords = [...coords];
      newCoords.splice(index, 1);
      const updatedFeature = updateFeatureGeometry(feature, newCoords);

      onFeatureChange?.(updatedFeature);
      logMessage('map_command', { 
        type: 'vertex_removed',
        index,
        featureId: feature.id
      });

      return updatedFeature;
    } catch (error) {
      logMessage('error', {
        type: 'vertex_remove_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return feature;
    }
  }, [onFeatureChange]);

  const moveVertex = useCallback((
    feature: GeoJSONFeature,
    index: number,
    coordinates: Position
  ) => {
    try {
      if (!isEditableFeature(feature)) {
        throw new Error('Feature must be a LineString or Polygon');
      }

      const coords = getFeatureCoordinates(feature);
      const newCoords = [...coords];
      newCoords[index] = coordinates;
      const updatedFeature = updateFeatureGeometry(feature, newCoords);

      onFeatureChange?.(updatedFeature);
      logMessage('map_command', { 
        type: 'vertex_moved',
        index,
        coordinates,
        featureId: feature.id
      });

      return updatedFeature;
    } catch (error) {
      logMessage('error', {
        type: 'vertex_move_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return feature;
    }
  }, [onFeatureChange]);

  const splitFeature = useCallback((
    feature: GeoJSONFeature,
    splitPoint: Position
  ) => {
    try {
      if (!isEditableFeature(feature)) {
        throw new Error('Feature must be a LineString or Polygon');
      }

      const coords = getFeatureCoordinates(feature);
      const line = turf.lineString(coords);
      const point = turf.point(splitPoint);
      const snapped = turf.nearestPointOnLine(line, point);
      const splitFeatures = turf.lineSplit(line, snapped);

      const features: GeoJSONFeature[] = splitFeatures.features.map(f => ({
        ...f,
        properties: { ...feature.properties }
      }));

      onFeatureSplit?.(features);
      logMessage('map_command', { 
        type: 'feature_split',
        featureId: feature.id,
        splitPoint
      });

      return features;
    } catch (error) {
      logMessage('error', {
        type: 'feature_split_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [feature];
    }
  }, [onFeatureSplit]);

  const mergeFeatures = useCallback((features: GeoJSONFeature[]) => {
    try {
      if (features.length < 2) {
        throw new Error('Need at least 2 features to merge');
      }

      if (!features.every(isEditableFeature)) {
        throw new Error('All features must be LineString or Polygon');
      }

      const allCoords = features.reduce((acc, feature) => {
        const coords = getFeatureCoordinates(feature as EditableFeature);
        return [...acc, ...coords];
      }, [] as Position[]);

      const line = turf.lineString(allCoords);
      const mergedFeature: GeoJSONFeature = {
        ...line,
        properties: { ...features[0].properties }
      };

      onFeatureMerge?.(mergedFeature);
      logMessage('map_command', { 
        type: 'features_merged',
        featureIds: features.map(f => f.id)
      });

      return mergedFeature;
    } catch (error) {
      logMessage('error', {
        type: 'feature_merge_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return features[0];
    }
  }, [onFeatureMerge]);

  return {
    editMode,
    selectedVertex,
    startVertexEdit,
    startSplitMode,
    startMergeMode,
    cancelEdit,
    addVertex,
    removeVertex,
    moveVertex,
    splitFeature,
    mergeFeatures,
    setSelectedVertex
  };
};
