import { HookRegistry } from "../hooks/HookRegistry";
import { HookType, HookFn } from "../hooks/HookTypes";

function createHookDecorator(type: HookType): MethodDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    // If target is a function, this is a STATIC method — target IS the class already
    // If target is an object, this is an INSTANCE method — use target.constructor
    const isStatic = typeof target === "function";
    const modelClass = isStatic ? target : target.constructor;

    const fn = (target as Record<string | symbol, HookFn>)[propertyKey];
    HookRegistry.register(modelClass, type, fn.bind(target));
  };
}

export const PreSave = () => createHookDecorator(HookType.PRE_SAVE);
export const PostSave = () => createHookDecorator(HookType.POST_SAVE);
export const PreUpdate = () => createHookDecorator(HookType.PRE_UPDATE);
export const PostUpdate = () => createHookDecorator(HookType.POST_UPDATE);
export const PreDelete = () => createHookDecorator(HookType.PRE_DELETE);
export const PostDelete = () => createHookDecorator(HookType.POST_DELETE);
