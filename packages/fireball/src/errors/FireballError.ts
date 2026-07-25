// Base error class — every Fireball error extends this.
// Lets consumers do: catch (err) { if (err instanceof FireballError) ... }
export class FireballError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = "FIREBALL_ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.code = code;

    // Maintains proper stack trace (V8 only, no-op elsewhere)
    if ("captureStackTrace" in Error) {
      (
        Error as ErrorConstructor & {
          captureStackTrace(
            targetObject: object,
            constructorOpt?: Function,
          ): void;
        }
      ).captureStackTrace(this, this.constructor);
    }
  }
}
