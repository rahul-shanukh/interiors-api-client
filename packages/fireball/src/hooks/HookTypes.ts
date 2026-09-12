export enum HookType {
  PRE_SAVE = "preSave",
  POST_SAVE = "postSave",
  PRE_UPDATE = "preUpdate",
  POST_UPDATE = "postUpdate",
  PRE_DELETE = "preDelete",
  POST_DELETE = "postDelete",
}

export type HookFn = (context: Record<string, unknown>) => void | Promise<void>;
