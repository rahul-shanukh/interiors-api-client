import { CollectionMetadata, FieldMetadata } from '../types/metadata.types';

// Represents the full schema of one model class:
// collection info + a map of every field declared on it
export class SchemaBlueprint {
  public collection: CollectionMetadata | null = null;
  public fields: Map<string, FieldMetadata> = new Map();

  addField(field: FieldMetadata): void {
    this.fields.set(field.propertyKey, field);
  }

  setCollection(meta: CollectionMetadata): void {
    this.collection = meta;
  }

  getField(propertyKey: string): FieldMetadata | undefined {
    return this.fields.get(propertyKey);
  }

  getAllFields(): FieldMetadata[] {
    return Array.from(this.fields.values());
  }
}