import { MetadataRegistry } from './MetadataRegistry';
import { SchemaBlueprint } from './SchemaBlueprint';

// Convenience read-layer so other modules (validation, query, model)
// never talk to MetadataRegistry directly — just to MetadataReader.
export class MetadataReader {
  static getBlueprint(target: Function): SchemaBlueprint {
    const blueprint = MetadataRegistry.get(target);
    if (!blueprint || !blueprint.collection) {
      throw new Error(
        `Fireball: "${target.name}" is missing @Collection() or has no registered fields.`
      );
    }
    return blueprint;
  }

  static getCollectionName(target: Function): string {
    return this.getBlueprint(target).collection!.name;
  }
}