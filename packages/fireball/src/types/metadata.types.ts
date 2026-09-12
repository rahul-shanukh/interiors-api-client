// Supported primitive field types Fireball understands out of the box
export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "array"
  | "map"
  | "reference";

// Options a developer can pass into @Field({ ... })
export interface FieldOptions {
  type?: FieldType;
  required?: boolean;
  default?: unknown | (() => unknown);
  validate?: (value: unknown) => boolean | string; // return true, or an error message
  schema?: Function; //reference to a nested class decorated with its own @Field entries
}

// Fully resolved metadata for a single field, stored internally
export interface FieldMetadata extends FieldOptions {
  propertyKey: string; // the class property name, e.g. "age"
  designType?: unknown; // the type TypeScript inferred via reflect-metadata
}

// Options a developer can pass into @Collection("name", { ... })
export interface CollectionOptions {
  timestamps?: boolean; // auto-manage createdAt/updatedAt
  softDelete?: boolean; // reserved for later plugin use
}

// Fully resolved metadata for an entire model class
export interface CollectionMetadata {
  name: string;
  target: Function;
  options: CollectionOptions;
}
