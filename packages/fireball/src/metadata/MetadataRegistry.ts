import { SchemaBlueprint } from './SchemaBlueprint';

// Singleton store: one SchemaBlueprint per model class (constructor function)
class MetadataRegistryClass {
  private registry: Map<Function, SchemaBlueprint> = new Map();

  // Get existing blueprint or create a new one if this class hasn't been seen yet
  getOrCreate(target: Function): SchemaBlueprint { 
    if (!this.registry.has(target)) {
      this.registry.set(target, new SchemaBlueprint());
    }
    return this.registry.get(target)!;
  }

  get(target: Function): SchemaBlueprint | undefined {
    return this.registry.get(target);
  }

  has(target: Function): boolean {
    return this.registry.has(target);
  }
}

// Exported as a singleton instance — the whole app shares this one registry
export const MetadataRegistry = new MetadataRegistryClass();