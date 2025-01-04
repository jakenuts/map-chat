import Supercluster from 'supercluster';
import { GeoJSONFeature } from '../types';
import { logMessage } from '../utils/logging';
import { BBox, Feature, GeoJSON, Point } from 'geojson';
import { isEditableFeature, getFeatureCoordinates } from '../utils/geometry';

export interface ClusterOptions {
  radius?: number;
  maxZoom?: number;
  minPoints?: number;
  nodeSize?: number;
  extent?: number;
  log?: boolean;
}

export interface Cluster {
  id: number;
  properties: {
    cluster: boolean;
    cluster_id?: number;
    point_count: number;
    point_count_abbreviated: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface ClusterProperties {
  cluster?: boolean;
  cluster_id?: number;
  point_count?: number;
  point_count_abbreviated?: string;
  originalFeature?: GeoJSONFeature;
  [key: string]: any;
}

interface ClusterFeature extends Feature<Point> {
  properties: ClusterProperties;
}

const DEFAULT_OPTIONS: Required<ClusterOptions> = {
  radius: 40,
  maxZoom: 16,
  minPoints: 2,
  nodeSize: 64,
  extent: 512,
  log: false
};

export class ClusterService {
  private supercluster: Supercluster<ClusterProperties>;
  private options: Required<ClusterOptions>;
  private features: GeoJSONFeature[] = [];

  constructor(options: ClusterOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.supercluster = new Supercluster({
      radius: this.options.radius,
      maxZoom: this.options.maxZoom,
      minPoints: this.options.minPoints,
      nodeSize: this.options.nodeSize,
      extent: this.options.extent,
      log: this.options.log
    });
  }

  private featureToPoint(feature: GeoJSONFeature): Feature<Point, ClusterProperties> {
    if (!isEditableFeature(feature)) {
      throw new Error('Feature must be a LineString or Polygon');
    }

    const coords = getFeatureCoordinates(feature);
    const centroid = coords.reduce(
      (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
      [0, 0]
    );
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          centroid[0] / coords.length,
          centroid[1] / coords.length
        ]
      },
      properties: {
        ...feature.properties,
        originalFeature: feature
      }
    };
  }

  loadFeatures(features: GeoJSONFeature[]) {
    try {
      this.features = features;
      const points = features.map(f => this.featureToPoint(f));
      this.supercluster.load(points);
      logMessage('map_command', { 
        type: 'features_loaded',
        count: features.length
      });
    } catch (error) {
      logMessage('error', {
        type: 'feature_load_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to load features for clustering');
    }
  }

  getClusters(bbox: BBox, zoom: number): (Cluster | GeoJSONFeature)[] {
    try {
      const clusters = this.supercluster.getClusters(bbox, zoom);
      logMessage('map_command', { 
        type: 'clusters_generated',
        count: clusters.length,
        zoom
      });
      return clusters;
    } catch (error) {
      logMessage('error', {
        type: 'cluster_generation_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to generate clusters');
    }
  }

  getClusterExpansionZoom(clusterId: number): number {
    try {
      const zoom = this.supercluster.getClusterExpansionZoom(clusterId);
      logMessage('map_command', { 
        type: 'cluster_expansion',
        clusterId,
        zoom
      });
      return zoom;
    } catch (error) {
      logMessage('error', {
        type: 'cluster_expansion_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to get cluster expansion zoom');
    }
  }

  getClusterChildren(clusterId: number): (Cluster | GeoJSONFeature)[] {
    try {
      const children = this.supercluster.getChildren(clusterId);
      logMessage('map_command', { 
        type: 'cluster_children',
        clusterId,
        count: children.length
      });
      return children;
    } catch (error) {
      logMessage('error', {
        type: 'cluster_children_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to get cluster children');
    }
  }

  getClusterLeaves(
    clusterId: number,
    limit = 10,
    offset = 0
  ): GeoJSONFeature[] {
    try {
      const leaves = this.supercluster.getLeaves(clusterId, limit, offset);
      const features = leaves
        .filter(leaf => leaf.properties.originalFeature)
        .map(leaf => leaf.properties.originalFeature as GeoJSONFeature);

      logMessage('map_command', { 
        type: 'cluster_leaves',
        clusterId,
        count: features.length
      });
      return features;
    } catch (error) {
      logMessage('error', {
        type: 'cluster_leaves_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to get cluster leaves');
    }
  }

  getClusterBounds(clusterId: number): BBox {
    try {
      const leaves = this.getClusterLeaves(clusterId, Infinity);
      const points = leaves.flatMap(leaf => {
        if (!isEditableFeature(leaf)) return [];
        return getFeatureCoordinates(leaf);
      });
      
      const bounds: BBox = [
        Math.min(...points.map(p => p[0])),
        Math.min(...points.map(p => p[1])),
        Math.max(...points.map(p => p[0])),
        Math.max(...points.map(p => p[1]))
      ];

      logMessage('map_command', { 
        type: 'cluster_bounds',
        clusterId,
        bounds
      });

      return bounds;
    } catch (error) {
      logMessage('error', {
        type: 'cluster_bounds_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to get cluster bounds');
    }
  }

  getClusterStats(): {
    totalFeatures: number;
    totalClusters: number;
    averagePointsPerCluster: number;
  } {
    try {
      const clusters = this.getClusters([-180, -90, 180, 90], 0);
      const clusterCount = clusters.filter(c => 
        (c as Cluster).properties?.cluster
      ).length;
      
      const stats = {
        totalFeatures: this.features.length,
        totalClusters: clusterCount,
        averagePointsPerCluster: this.features.length / (clusterCount || 1)
      };

      logMessage('map_command', { 
        type: 'cluster_stats',
        stats
      });

      return stats;
    } catch (error) {
      logMessage('error', {
        type: 'cluster_stats_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to get cluster stats');
    }
  }
}
