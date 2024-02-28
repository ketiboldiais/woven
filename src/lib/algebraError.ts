/**
 * An object corresponding to an error occurring
 * during the algebraic runtime.
 */
export class AlgebraError extends Error {
  $errors: [string, string][];
  constructor(message: string, phase: string) {
    super(message);
    this.$errors = [[message, phase]];
  }
  addError(message: string, phase: string) {
    this.$errors.push([message, phase]);
    return this;
  }
}

/** Returns a new algebra error. */
export const algebraError = (message: string, phase: string) => (
  new AlgebraError(message, phase)
);
