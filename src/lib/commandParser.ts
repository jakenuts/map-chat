import { MapCommand, MapCommandType } from './types';

const COMMAND_REGEX = /\[([\w_]+)(?:\s+([^\]]+))?\]/g;

interface ParsedCommand {
  type: MapCommandType;
  args: string[];
}

export function parseMapCommands(text: string): ParsedCommand[] {
  const commands: ParsedCommand[] = [];
  let match;

  while ((match = COMMAND_REGEX.exec(text)) !== null) {
    const [, type, argsStr] = match;
    const args = argsStr ? argsStr.split(' ').map(arg => arg.trim()) : [];
    
    if (isValidCommandType(type)) {
      commands.push({ type, args });
    }
  }

  return commands;
}

function isValidCommandType(type: string): type is MapCommandType {
  return [
    'zoom_to',
    'add_feature',
    'modify_feature',
    'remove_feature',
    'style_feature',
    'measure',
    'buffer'
  ].includes(type);
}

export function convertToMapCommand(parsed: ParsedCommand): MapCommand | null {
  try {
    switch (parsed.type) {
      case 'zoom_to': {
        const [lat, lon, zoom] = parsed.args;
        return {
          type: 'zoom_to',
          parameters: {
            coordinates: [parseFloat(lat), parseFloat(lon)],
            zoom: zoom ? parseInt(zoom) : undefined
          }
        };
      }

      case 'add_feature': {
        const [featureJson, layerId] = parsed.args;
        return {
          type: 'add_feature',
          parameters: {
            feature: JSON.parse(featureJson),
            layerId
          }
        };
      }

      case 'modify_feature': {
        const [featureId, propertiesJson] = parsed.args;
        return {
          type: 'modify_feature',
          parameters: {
            featureId,
            properties: JSON.parse(propertiesJson)
          }
        };
      }

      case 'remove_feature': {
        const [featureId, layerId] = parsed.args;
        return {
          type: 'remove_feature',
          parameters: {
            featureId,
            layerId
          }
        };
      }

      case 'style_feature': {
        const [featureId, styleJson] = parsed.args;
        return {
          type: 'style_feature',
          parameters: {
            featureId,
            style: JSON.parse(styleJson)
          }
        };
      }

      case 'measure': {
        const [type, ...featureJsons] = parsed.args;
        return {
          type: 'measure',
          parameters: {
            type: type as 'distance' | 'area',
            features: featureJsons.map(json => JSON.parse(json))
          }
        };
      }

      case 'buffer': {
        const [featureJson, distance, units] = parsed.args;
        return {
          type: 'buffer',
          parameters: {
            feature: JSON.parse(featureJson),
            distance: parseFloat(distance),
            units: units as 'kilometers' | 'miles' | 'meters'
          }
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('Error converting command:', error);
    return null;
  }
}

export function extractMapCommands(text: string): MapCommand[] {
  const parsedCommands = parseMapCommands(text);
  return parsedCommands
    .map(cmd => convertToMapCommand(cmd))
    .filter((cmd): cmd is MapCommand => cmd !== null);
}
