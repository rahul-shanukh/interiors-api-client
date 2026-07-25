import { HookRegistry } from "./HookRegistry";
import { HookType } from "./HookTypes";

export class HookExecutor {
  // Runs all hooks of a given type, in registration order, sequentially
  static async run(
    target: Function,
    type: HookType,
    context: Record<string, unknown>,
  ): Promise<void> {
    const hooks = HookRegistry.getHooks(target, type);
    for (const hook of hooks) {
      await hook(context);
    }
  }
}
