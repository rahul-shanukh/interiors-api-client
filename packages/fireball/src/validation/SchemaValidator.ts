import { MetadataRegistry } from "../metadata/MetadataRegistry";
import { SchemaBlueprint } from "../metadata/SchemaBlueprint";
import { FieldMetadata } from "../types/metadata.types";
import {
  ValidationError,
  FieldValidationIssue,
} from "../errors/ValidationError";

export class SchemaValidator {
  static validate(
    blueprint: SchemaBlueprint,
    input: Record<string, unknown>,
  ): Record<string, unknown> {
    const issues: FieldValidationIssue[] = [];
    const output = this.validateFields(blueprint, input, issues, "");

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
    return output;
  }

  // Extracted so it can recurse — `pathPrefix` gives nested errors like "rooms.living"
  private static validateFields(
    blueprint: SchemaBlueprint,
    input: Record<string, unknown>,
    issues: FieldValidationIssue[],
    pathPrefix: string,
  ): Record<string, unknown> {
    const output: Record<string, unknown> = {};

    for (const field of blueprint.getAllFields()) {
      const rawValue = input[field.propertyKey];
      const fieldPath = pathPrefix
        ? `${pathPrefix}.${field.propertyKey}`
        : field.propertyKey;
      const resolved = this.resolveValue(field, rawValue, issues, fieldPath);
      if (resolved !== undefined) {
        output[field.propertyKey] = resolved;
      }
    }

    return output;
  }

  private static resolveValue(
    field: FieldMetadata,
    rawValue: unknown,
    issues: FieldValidationIssue[],
    fieldPath: string,
  ): unknown {
    let value = rawValue;

    if (value === undefined && field.default !== undefined) {
      value =
        typeof field.default === "function"
          ? (field.default as () => unknown)()
          : field.default;
    }

    if (field.required && (value === undefined || value === null)) {
      issues.push({ field: fieldPath, message: "is required" });
      return undefined;
    }

    if (value === undefined) {
      return undefined;
    }

    // NEW: nested schema recursion
    if (field.schema) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        issues.push({
          field: fieldPath,
          message: `expected an object matching nested schema`,
        });
        return value;
      }
      const nestedBlueprint = MetadataRegistry.get(field.schema);
      if (!nestedBlueprint) {
        issues.push({
          field: fieldPath,
          message: `nested schema "${field.schema.name}" has no registered fields`,
        });
        return value;
      }
      return this.validateFields(
        nestedBlueprint,
        value as Record<string, unknown>,
        issues,
        fieldPath,
      );
    }

    if (field.type && !this.matchesType(value, field.type)) {
      issues.push({
        field: fieldPath,
        message: `expected type "${field.type}" but got "${typeof value}"`,
      });
      return value;
    }

    if (field.validate) {
      const result = field.validate(value);
      if (result !== true) {
        issues.push({
          field: fieldPath,
          message:
            typeof result === "string" ? result : "failed custom validation",
        });
      }
    }

    return value;
  }

  private static matchesType(value: unknown, type: string): boolean {
    switch (type) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !Number.isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      case "date":
        return (
          value instanceof Date || !Number.isNaN(Date.parse(value as string))
        );
      case "array":
        return Array.isArray(value);
      case "map":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      case "reference":
        return typeof value === "string" || typeof value === "object";
      default:
        return true;
    }
  }
}
