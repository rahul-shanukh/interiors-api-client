import { HookType, HookFn } from "./HookTypes";

// Singleton — stores registered hooks per model class, per hook type
class HookRegistryClass {
  private hooks: Map<Function, Map<HookType, HookFn[]>> = new Map();

  register(target: Function, type: HookType, fn: HookFn): void {
    if (!this.hooks.has(target)) {
      this.hooks.set(target, new Map());
    }
    const modelHooks = this.hooks.get(target)!;
    if (!modelHooks.has(type)) {
      modelHooks.set(type, []);
    }
    modelHooks.get(type)!.push(fn);
  }

  getHooks(target: Function, type: HookType): HookFn[] {
    return this.hooks.get(target)?.get(type) ?? [];
  }
}

export const HookRegistry = new HookRegistryClass();
