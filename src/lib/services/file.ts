import { GeoJSONFeature } from '../types';
import { logMessage } from '../utils/logging';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection } from 'geojson';

export type FileFormat = 'geojson' | 'kml';

export class FileService {
  private validateGeoJSON(json: string): boolean {
    try {
      const data = JSON.parse(json);
      return (
        data &&
        (data.type === 'Feature' ||
          data.type === 'FeatureCollection' ||
          data.type === 'GeometryCollection')
      );
    } catch {
      return false;
    }
  }

  private validateKML(kml: string): boolean {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(kml, 'text/xml');
      return !doc.querySelector('parsererror');
    } catch {
      return false;
    }
  }

  private kmlToGeoJSON(kml: string): GeoJSONFeature[] {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(kml, 'text/xml');
      const placemarks = doc.getElementsByTagName('Placemark');
      const features: GeoJSONFeature[] = [];

      for (let i = 0; i < placemarks.length; i++) {
        const placemark = placemarks[i];
        const name = placemark.getElementsByTagName('name')[0]?.textContent || '';
        const description = placemark.getElementsByTagName('description')[0]?.textContent || '';
        const coordinates = placemark.getElementsByTagName('coordinates')[0]?.textContent || '';

        if (coordinates) {
          const coords = coordinates
            .trim()
            .split(' ')
            .map(coord => coord.split(',').map(Number).slice(0, 2));

          const feature: GeoJSONFeature = {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords
            },
            properties: {
              name,
              description
            }
          };

          features.push(feature);
        }
      }

      return features;
    } catch (error) {
      logMessage('error', {
        type: 'kml_parse_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to parse KML file');
    }
  }

  private geoJSONToKML(features: GeoJSONFeature[]): string {
    try {
      const kml = [`<?xml version="1.0" encoding="UTF-8"?>`,
        '<kml xmlns="http://www.opengis.net/kml/2.2">',
        '<Document>'];

      features.forEach((feature, index) => {
        const name = feature.properties?.name || `Feature ${index + 1}`;
        const description = feature.properties?.description || '';
        const coordinates = feature.geometry.type === 'LineString'
          ? feature.geometry.coordinates
            .map(coord => coord.join(','))
            .join(' ')
          : '';

        if (coordinates) {
          kml.push(
            '<Placemark>',
            `<name>${name}</name>`,
            `<description>${description}</description>`,
            '<LineString>',
            '<coordinates>',
            coordinates,
            '</coordinates>',
            '</LineString>',
            '</Placemark>'
          );
        }
      });

      kml.push('</Document>', '</kml>');
      return kml.join('\n');
    } catch (error) {
      logMessage('error', {
        type: 'kml_generate_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to generate KML file');
    }
  }

  exportToGeoJSON(features: GeoJSONFeature[]): string {
    try {
      const featureCollection: FeatureCollection = {
        type: 'FeatureCollection',
        features
      };
      
      const json = JSON.stringify(featureCollection, null, 2);
      logMessage('map_command', { type: 'geojson_export' });
      return json;
    } catch (error) {
      logMessage('error', {
        type: 'geojson_export_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to export GeoJSON');
    }
  }

  exportToKML(features: GeoJSONFeature[]): string {
    try {
      const kml = this.geoJSONToKML(features);
      logMessage('map_command', { type: 'kml_export' });
      return kml;
    } catch (error) {
      logMessage('error', {
        type: 'kml_export_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to export KML');
    }
  }

  importFromGeoJSON(json: string): GeoJSONFeature[] {
    try {
      if (!this.validateGeoJSON(json)) {
        throw new Error('Invalid GeoJSON format');
      }

      const data = JSON.parse(json);
      let features: Feature[] = [];

      if (data.type === 'FeatureCollection') {
        features = data.features;
      } else if (data.type === 'Feature') {
        features = [data];
      }

      logMessage('map_command', { type: 'geojson_import' });
      return features as GeoJSONFeature[];
    } catch (error) {
      logMessage('error', {
        type: 'geojson_import_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to import GeoJSON');
    }
  }

  importFromKML(kml: string): GeoJSONFeature[] {
    try {
      if (!this.validateKML(kml)) {
        throw new Error('Invalid KML format');
      }

      const features = this.kmlToGeoJSON(kml);
      logMessage('map_command', { type: 'kml_import' });
      return features;
    } catch (error) {
      logMessage('error', {
        type: 'kml_import_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to import KML');
    }
  }

  async saveToFile(data: string, format: FileFormat): Promise<void> {
    try {
      const blob = new Blob([data], { type: `application/${format}` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      logMessage('map_command', { type: 'file_save', format });
    } catch (error) {
      logMessage('error', {
        type: 'file_save_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to save file');
    }
  }

  async loadFromFile(format: FileFormat): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = `.${format}`;

        input.onchange = async (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) {
            reject(new Error('No file selected'));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            const content = reader.result as string;
            logMessage('map_command', { type: 'file_load', format });
            resolve(content);
          };
          reader.onerror = () => {
            reject(new Error('Failed to read file'));
          };
          reader.readAsText(file);
        };

        input.click();
      } catch (error) {
        logMessage('error', {
          type: 'file_load_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        reject(new Error('Failed to load file'));
      }
    });
  }
}
