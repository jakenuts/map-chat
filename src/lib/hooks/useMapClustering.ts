import { useCallback, useEffect, useRef, useState } from 'react';
import { BBox } from 'geojson';
import { GeoJSONFeature } from '../types';
import { ClusterService, Cluster, ClusterOptions } from '../services/cluster';
import { logMessage } from '../utils/logging';

interface UseMapClusteringProps {
  features: GeoJSONFeature[];
  options?: ClusterOptions;
  onClusterClick?: (cluster: Cluster, features: GeoJSONFeature[]) => void;
  onClusterExpand?: (cluster: Cluster, zoom: number) => void;
}

export const useMapClustering = ({
  features,
  options,
  onClusterClick,
  onClusterExpand
}: UseMapClusteringProps) => {
  const clusterServiceRef = useRef<ClusterService>(new ClusterService(options));
  const [clusters, setClusters] = useState<(Cluster | GeoJSONFeature)[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);

  // Initialize cluster service with features
  useEffect(() => {
    try {
      clusterServiceRef.current.loadFeatures(features);
      logMessage('map_command', { 
        type: 'clustering_initialized',
        featureCount: features.length
      });
    } catch (error) {
      logMessage('error', {
        type: 'clustering_init_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [features]);

  const updateClusters = useCallback((bbox: BBox, zoom: number) => {
    try {
      const newClusters = clusterServiceRef.current.getClusters(bbox, zoom);
      setClusters(newClusters);
      logMessage('map_command', { 
        type: 'clusters_updated',
        count: newClusters.length,
        zoom
      });
    } catch (error) {
      logMessage('error', {
        type: 'cluster_update_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, []);

  const handleClusterClick = useCallback((cluster: Cluster) => {
    try {
      setSelectedClusterId(cluster.id);
      const features = clusterServiceRef.current.getClusterLeaves(cluster.id);
      onClusterClick?.(cluster, features);

      const expansionZoom = clusterServiceRef.current.getClusterExpansionZoom(cluster.id);
      onClusterExpand?.(cluster, expansionZoom);

      logMessage('map_command', { 
        type: 'cluster_clicked',
        clusterId: cluster.id,
        featureCount: features.length,
        expansionZoom
      });
    } catch (error) {
      logMessage('error', {
        type: 'cluster_click_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [onClusterClick, onClusterExpand]);

  const getClusterBounds = useCallback((clusterId: number): BBox => {
    try {
      return clusterServiceRef.current.getClusterBounds(clusterId);
    } catch (error) {
      logMessage('error', {
        type: 'cluster_bounds_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Return world bounds as fallback
      return [-180, -90, 180, 90];
    }
  }, []);

  const getClusterStats = useCallback(() => {
    try {
      return clusterServiceRef.current.getClusterStats();
    } catch (error) {
      logMessage('error', {
        type: 'cluster_stats_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        totalFeatures: features.length,
        totalClusters: 0,
        averagePointsPerCluster: 0
      };
    }
  }, [features.length]);

  const isCluster = useCallback((feature: Cluster | GeoJSONFeature): feature is Cluster => {
    return 'properties' in feature && 
           feature.properties?.cluster === true &&
           typeof feature.properties?.point_count === 'number';
  }, []);

  return {
    clusters,
    selectedClusterId,
    updateClusters,
    handleClusterClick,
    getClusterBounds,
    getClusterStats,
    isCluster
  };
};
