import { MetadataReader } from "../metadata/MetadataReader";
import { SchemaValidator } from "../validation/SchemaValidator";
import { FireballEngine } from "../core/FireballEngine";
import { QueryBuilder } from "../query/QueryBuilder";
import { HookExecutor } from "../hooks/HookExecutor";
import { HookType } from "../hooks/HookTypes";

export class Steward {
  static async create<T extends typeof Steward>(
    this: T,
    input: Record<string, unknown>,
  ) {
    const blueprint = MetadataReader.getBlueprint(this);
    const validated = SchemaValidator.validate(blueprint, input);

    // Apply timestamps if enabled
    if (blueprint.collection?.options.timestamps) {
      validated.createdAt = new Date();
      validated.updatedAt = new Date();
    }

    await HookExecutor.run(this, HookType.PRE_SAVE, validated);

    const adapter = FireballEngine.getAdapter();
    const collectionName = blueprint.collection!.name;
    const result = await adapter.create(collectionName, validated);
    const created = { id: result.id, ...result.data };

    await HookExecutor.run(this, HookType.POST_SAVE, created);
    return created;
  }

  static async findById<T extends typeof Steward>(this: T, id: string) {
    const blueprint = MetadataReader.getBlueprint(this);
    const adapter = FireballEngine.getAdapter();
    const collectionName = blueprint.collection!.name;

    const data = await adapter.findById(collectionName, id);
    if (!data) return null;

    // Hide soft-deleted docs from normal findById
    if (blueprint.collection?.options.softDelete && data.deletedAt) {
      return null;
    }

    return { id, ...data };
  }

  static find<T extends typeof Steward>(
    this: T,
  ): QueryBuilder<InstanceType<T>> {
    return new QueryBuilder<InstanceType<T>>(this);
  }

  static async findOne<T extends typeof Steward>(this: T) {
    const results = await new QueryBuilder(this).limit(1).exec();
    return results[0] ?? null;
  }

  static async updateById<T extends typeof Steward>(
    this: T,
    id: string,
    input: Record<string, unknown>,
  ) {
    const blueprint = MetadataReader.getBlueprint(this);
    const adapter = FireballEngine.getAdapter();
    const collectionName = blueprint.collection!.name;

    const partialFields = new Map(
      blueprint
        .getAllFields()
        .filter((f) => input[f.propertyKey] !== undefined)
        .map((f) => [f.propertyKey, f]),
    );
    const partialBlueprint = Object.assign(
      Object.create(Object.getPrototypeOf(blueprint)),
      blueprint,
    );
    partialBlueprint.fields = partialFields;

    const validated = SchemaValidator.validate(partialBlueprint, input);

    if (blueprint.collection?.options.timestamps) {
      validated.updatedAt = new Date();
    }

    await HookExecutor.run(this, HookType.PRE_UPDATE, validated);
    await adapter.update(collectionName, id, validated);
    await HookExecutor.run(this, HookType.POST_UPDATE, { id, ...validated });

    return this.findById(id);
  }

  static async deleteById<T extends typeof Steward>(
    this: T,
    id: string,
  ): Promise<void> {
    const blueprint = MetadataReader.getBlueprint(this);
    const adapter = FireballEngine.getAdapter();
    const collectionName = blueprint.collection!.name;

    await HookExecutor.run(this, HookType.PRE_DELETE, { id });

    if (blueprint.collection?.options.softDelete) {
      // Soft delete: mark instead of removing
      await adapter.update(collectionName, id, { deletedAt: new Date() });
    } else {
      // Hard delete: actually remove
      await adapter.delete(collectionName, id);
    }

    await HookExecutor.run(this, HookType.POST_DELETE, { id });
  }

  // New: permanently remove, bypassing soft-delete entirely
  static async hardDeleteById<T extends typeof Steward>(
    this: T,
    id: string,
  ): Promise<void> {
    const blueprint = MetadataReader.getBlueprint(this);
    const adapter = FireballEngine.getAdapter();
    const collectionName = blueprint.collection!.name;

    await adapter.delete(collectionName, id);
  }

  // New: restore a soft-deleted document
  static async restoreById<T extends typeof Steward>(this: T, id: string) {
    const blueprint = MetadataReader.getBlueprint(this);
    const adapter = FireballEngine.getAdapter();
    const collectionName = blueprint.collection!.name;

    await adapter.update(collectionName, id, { deletedAt: null });
    return this.findById(id);
  }
}
