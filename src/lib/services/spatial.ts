import * as turf from '@turf/turf';
import { GeoJSONFeature, FeatureId } from '../types';
import { logMessage } from '../utils/logging';
import { fromGeoJSONFeature, toGeoJSONFeature } from '../utils/geo';
import { Feature, Geometry, BBox } from 'geojson';

export class SpatialService {
  calculateDistance(features: GeoJSONFeature[]): number {
    if (features.length < 2) {
      logMessage('error', { 
        type: 'spatial_error', 
        message: 'Need at least 2 features to calculate distance' 
      });
      return 0;
    }

    try {
      let totalDistance = 0;
      for (let i = 0; i < features.length - 1; i++) {
        const from = fromGeoJSONFeature(features[i]);
        const to = fromGeoJSONFeature(features[i + 1]);
        
        const distance = turf.distance(
          turf.center(from),
          turf.center(to),
          { units: 'kilometers' }
        );
        totalDistance += distance;
      }

      logMessage('map_command', { 
        type: 'measure_distance', 
        distance: totalDistance 
      });
      return totalDistance;
    } catch (error) {
      logMessage('error', { 
        type: 'spatial_error', 
        message: 'Error calculating distance',
        error 
      });
      return 0;
    }
  }

  calculateArea(features: GeoJSONFeature[]): number {
    if (features.length === 0) {
      logMessage('error', { 
        type: 'spatial_error', 
        message: 'No features provided for area calculation' 
      });
      return 0;
    }

    try {
      let totalArea = 0;
      for (const feature of features) {
        const geojsonFeature = fromGeoJSONFeature(feature);
        const area = turf.area(geojsonFeature);
        totalArea += area;
      }

      // Convert from square meters to square kilometers
      const areaInKm2 = totalArea / 1000000;
      logMessage('map_command', { 
        type: 'measure_area', 
        area: areaInKm2 
      });
      return areaInKm2;
    } catch (error) {
      logMessage('error', { 
        type: 'spatial_error', 
        message: 'Error calculating area',
        error 
      });
      return 0;
    }
  }

  createBuffer(
    feature: GeoJSONFeature,
    distance: number,
    units: 'kilometers' | 'miles' | 'meters'
  ): GeoJSONFeature {
    try {
      const geojsonFeature = fromGeoJSONFeature(feature);
      const buffered = turf.buffer(geojsonFeature, distance, { units });
      
      if (!buffered) {
        throw new Error('Buffer operation returned undefined');
      }

      const result = toGeoJSONFeature(buffered);
      logMessage('map_command', { 
        type: 'create_buffer', 
        feature: feature.id,
        distance,
        units 
      });
      return result;
    } catch (error) {
      logMessage('error', { 
        type: 'spatial_error', 
        message: 'Error creating buffer',
        error 
      });
      return feature; // Return original feature on error
    }
  }

  simplifyGeometry(feature: GeoJSONFeature, tolerance: number): GeoJSONFeature {
    try {
      const geojsonFeature = fromGeoJSONFeature(feature);
      const simplified = turf.simplify(geojsonFeature, { tolerance });
      const result = toGeoJSONFeature(simplified);

      logMessage('map_command', { 
        type: 'simplify_geometry', 
        feature: feature.id,
        tolerance 
      });
      return result;
    } catch (error) {
      logMessage('error', { 
        type: 'spatial_error', 
        message: 'Error simplifying geometry',
        error 
      });
      return feature;
    }
  }

  getBoundingBox(features: GeoJSONFeature[]): [number, number, number, number] | null {
    if (features.length === 0) {
      logMessage('error', { 
        type: 'spatial_error', 
        message: 'No features provided for bounding box calculation' 
      });
      return null;
    }

    try {
      const collection = turf.featureCollection(
        features.map(f => fromGeoJSONFeature(f))
      );
      const bbox = turf.bbox(collection);

      // Convert 3D bbox to 2D if necessary
      const bounds: [number, number, number, number] = [
        bbox[0], bbox[1], 
        bbox[bbox.length - 3], bbox[bbox.length - 2]
      ];

      logMessage('map_command', { 
        type: 'get_bounds', 
        bounds 
      });
      return bounds;
    } catch (error) {
      logMessage('error', { 
        type: 'spatial_error', 
        message: 'Error calculating bounding box',
        error 
      });
      return null;
    }
  }

  getCentroid(feature: GeoJSONFeature): GeoJSONFeature {
    try {
      const geojsonFeature = fromGeoJSONFeature(feature);
      const centroid = turf.centroid(geojsonFeature);
      const result = toGeoJSONFeature(centroid);

      logMessage('map_command', { 
        type: 'get_centroid', 
        feature: feature.id 
      });
      return result;
    } catch (error) {
      logMessage('error', { 
        type: 'spatial_error', 
        message: 'Error calculating centroid',
        error 
      });
      return feature;
    }
  }
}
