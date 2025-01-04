import { MapMethods } from '../types';
import { logMapCommand } from '../utils/logging';
import { extractMapCommands } from '../commandParser';

export class MapService {
  private readonly mapMethods: MapMethods;

  constructor(mapMethods: MapMethods) {
    this.mapMethods = mapMethods;
  }

  executeMapCommands(text: string): string {
    const commands = extractMapCommands(text);

    commands.forEach(command => {
      try {
        switch (command.type) {
          case 'zoom_to':
            this.mapMethods.zoomTo(command.parameters.coordinates, command.parameters.zoom);
            break;
          case 'add_feature':
            this.mapMethods.addFeature(
              command.parameters.feature,
              command.parameters.layerId,
              command.parameters.style
            );
            break;
          case 'modify_feature':
            this.mapMethods.modifyFeature(
              command.parameters.featureId,
              command.parameters.properties
            );
            break;
          case 'remove_feature':
            this.mapMethods.removeFeature(
              command.parameters.featureId,
              command.parameters.layerId
            );
            break;
          case 'style_feature':
            this.mapMethods.styleFeature(
              command.parameters.featureId,
              command.parameters.style
            );
            break;
          case 'measure':
            const result = this.mapMethods.measure(
              command.parameters.type,
              command.parameters.features
            );
            console.log(`Measurement result: ${result}`);
            break;
          case 'buffer':
            const buffered = this.mapMethods.buffer(
              command.parameters.feature,
              command.parameters.distance,
              command.parameters.units
            );
            this.mapMethods.addFeature(buffered, 'buffers');
            break;
        }
        logMapCommand(command, true);
      } catch (error) {
        logMapCommand(command, false, error);
        console.error(`Error executing map command: ${command.type}`, error);
      }
    });

    return text;
  }
}
