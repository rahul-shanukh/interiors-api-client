import { MetadataRegistry } from '../metadata/MetadataRegistry';
import { CollectionOptions } from '../types/metadata.types';

// Class decorator: @Collection("users", { timestamps: true })
export function Collection(name: string, options: CollectionOptions = {}): ClassDecorator {
  return (target: Function) => {
    const blueprint = MetadataRegistry.getOrCreate(target);

    blueprint.setCollection({
      name,
      target,
      options,
    });
  };
}