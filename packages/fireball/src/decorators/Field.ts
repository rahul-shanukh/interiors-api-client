import 'reflect-metadata';
import { MetadataRegistry } from '../metadata/MetadataRegistry';
import { FieldOptions, FieldMetadata } from '../types/metadata.types';

// Property decorator: @Field({ required: true, type: 'string' })
export function Field(options: FieldOptions = {}): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const blueprint = MetadataRegistry.getOrCreate(target.constructor);

    const designType = Reflect.getMetadata('design:type', target, propertyKey);

    const fieldMeta: FieldMetadata = {
      ...options,
      propertyKey: propertyKey.toString(),
      designType,
    };

    blueprint.addField(fieldMeta);
  };
}