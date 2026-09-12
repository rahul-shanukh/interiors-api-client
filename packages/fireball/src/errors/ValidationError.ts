import { FireballError } from "./FireballError";

// One individual field-level failure
export interface FieldValidationIssue {
  field: string;
  message: string;
}

export class ValidationError extends FireballError {
  public readonly issues: FieldValidationIssue[];

  constructor(issues: FieldValidationIssue[]) {
    const summary = issues.map((i) => `${i.field}: ${i.message}`).join("; ");
    super(`Validation failed — ${summary}`, "VALIDATION_ERROR");
    this.issues = issues;
  }
}
