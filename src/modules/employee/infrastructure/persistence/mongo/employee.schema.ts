import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// 1. Core Identity (Immutable)
@Schema({ _id: false })
class CoreIdentity {
  @Prop({ required: true, unique: true, index: true })
  emp_id: string; // e.g., "SE282"

  @Prop({ required: true })
  first_name: string;

  @Prop()
  middle_name?: string;

  @Prop({ required: true })
  last_name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: String, default: null })
  profile_pic: string | null;
}

// 2. Employment Lifecycle (Time-Series Ready)
@Schema({ _id: false })
class EmploymentLifecycle {
  @Prop({ required: true })
  hire_date: string; // e.g., "2023-08-21"

  @Prop({ default: 'Active' }) // Could be Probation, Active, Notice Period
  status: string;

  @Prop({ required: true, index: true })
  role_group: string; // e.g., "employee" or "admin"
}

// --- Reusable Address Schema ---
@Schema({ _id: false })
class Address {
  @Prop() street: string;

  @Prop() city: string;

  @Prop() state: string;

  @Prop() zip_code: string;

  @Prop({ default: 'India' })
  country: string;
}

// 3. Contact & Location (Bio-Data)
@Schema({ _id: false })
class ContactLocation {
  @Prop() phone: string;
  @Prop() gender: string;
  @Prop() dob: string; // Mapped from 'date_of_birth'

  // Embed the Address schema here
  @Prop({ type: Address })
  current_address: Address;

  @Prop({ type: Address })
  permanent_address: Address;

  @Prop({ type: Address })
  office_address: Address;
}

// 4. Technical & Capability (Skills Matrix)
// (Based on the 'skills-config' request we saw earlier)
@Schema({ _id: false })
class TechnicalCapability {
  @Prop({ type: [String], default: [] })
  skills: string[]; // e.g., ["AutoCAD", "Telecom"]

  @Prop({ default: 'Junior' })
  level: string;
}

// 5. The PMO & Performance Bridge (Relational)
@Schema({ _id: false })
class PmoBridge {
  @Prop({ index: true })
  manager_id: string; // Links to another emp_id (e.g., "SE228")

  @Prop() department_name: string; // e.g., "PRODUCTION"

  @Prop() role_name: string; // e.g., "TELECOM ENGINEER"
}

// 6. System Audit (Soft Deletes & Tracking)
@Schema({ _id: false })
class SystemAudit {
  @Prop({ default: false })
  isDeleted: boolean;

  // Add "type: Date" right here
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

// ==========================================
// THE MAIN EMPLOYEE DOCUMENT
// ==========================================
export type EmployeeDocument = Employee & Document;

@Schema({ collection: 'employees', timestamps: true }) // timestamps auto-adds createdAt/updatedAt
export class Employee {
  @Prop({ type: CoreIdentity, required: true })
  identity: CoreIdentity;

  @Prop({ type: EmploymentLifecycle, required: true })
  lifecycle: EmploymentLifecycle;

  @Prop({ type: ContactLocation })
  contact: ContactLocation;

  @Prop({ type: TechnicalCapability })
  capabilities: TechnicalCapability;

  @Prop({ type: PmoBridge, required: true })
  pmo: PmoBridge;

  @Prop({ type: SystemAudit, default: () => ({}) })
  audit: SystemAudit;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
