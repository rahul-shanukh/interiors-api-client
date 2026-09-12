import 'reflect-metadata';
import mongoose, { model } from 'mongoose';
import { EmployeeSchema } from '../modules/employee/infrastructure/persistence/mongo/employee.schema';
import { UserSchema } from '../modules/user/infrastructure/persistence/mongo/user.schema';
import { Employee } from '../modules/employee/domain/entities/employee.entity';
import { EmployeeId } from '../modules/employee/domain/value-objects/employee-id.vo';
import { EmployeeRole } from '../modules/employee/domain/value-objects/employee-role.vo';
import {
  Address,
  AddressType,
} from '../modules/employee/domain/value-objects/address.vo';
import { Name } from '../modules/employee/domain/value-objects/name.vo';
import { EmployeeMapper } from '../modules/employee/infrastructure/mappers/employee.mapper';
import { User } from '../modules/user/domain/entities/user.entity';

/**
 * This script bootstraps the very first admin for the system.
 *
 * Why this exists:
 * - We do not want a public "sign up as admin" page.
 * - The first admin must be created in a controlled way.
 * - After the first admin exists, that admin can manage the system normally.
 *
 * Important idea in this codebase:
 * - "Employee" = the company/person record
 * - "User" = the login account linked to that employee
 *
 * That means this script may need to create:
 * 1. the employee record
 * 2. the user/login record
 *
 * It is written to be safe to run more than once.
 *
 * Example PowerShell usage:
 * $env:MONGO_URI="mongodb://localhost:27017/your-db"
 * $env:SEED_ADMIN_EMP_ID="SE282"
 * $env:SEED_ADMIN_EMAIL="admin@example.com"
 * $env:SEED_ADMIN_PASSWORD="StrongPass123"
 * $env:SEED_ADMIN_FIRST_NAME="System"
 * $env:SEED_ADMIN_LAST_NAME="Admin"
 * pnpm --dir backend seed:admin
 */
type EnvMap = {
  MONGO_URI: string;
  SEED_ADMIN_EMP_ID: string;
  SEED_ADMIN_EMAIL: string;
  SEED_ADMIN_PASSWORD: string;
  SEED_ADMIN_FIRST_NAME: string;
  SEED_ADMIN_LAST_NAME: string;
  SEED_ADMIN_STREET: string;
  SEED_ADMIN_CITY: string;
  SEED_ADMIN_STATE: string;
  SEED_ADMIN_POSTAL_CODE: string;
  SEED_ADMIN_COUNTRY: string;
};

/**
 * Reads a required environment variable.
 *
 * If the variable is missing, we fail early with a clear error
 * instead of partially creating data in the database.
 */
function getEnv(name: keyof EnvMap, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

async function seedAdmin() {
  /**
   * Collect all configuration needed for the seed.
   *
   * Some values are mandatory, like:
   * - Mongo connection string
   * - employee ID
   * - email
   * - password
   *
   * Some values have sensible defaults so the script is easier to run.
   */
  const env: EnvMap = {
    MONGO_URI: getEnv('MONGO_URI'),
    SEED_ADMIN_EMP_ID: getEnv('SEED_ADMIN_EMP_ID'),
    SEED_ADMIN_EMAIL: getEnv('SEED_ADMIN_EMAIL'),
    SEED_ADMIN_PASSWORD: getEnv('SEED_ADMIN_PASSWORD'),
    SEED_ADMIN_FIRST_NAME: getEnv('SEED_ADMIN_FIRST_NAME', 'System'),
    SEED_ADMIN_LAST_NAME: getEnv('SEED_ADMIN_LAST_NAME', 'Admin'),
    SEED_ADMIN_STREET: getEnv('SEED_ADMIN_STREET', 'Admin Street'),
    SEED_ADMIN_CITY: getEnv('SEED_ADMIN_CITY', 'Warangal'),
    SEED_ADMIN_STATE: getEnv('SEED_ADMIN_STATE', 'Telangana'),
    SEED_ADMIN_POSTAL_CODE: getEnv('SEED_ADMIN_POSTAL_CODE', '506002'),
    SEED_ADMIN_COUNTRY: getEnv('SEED_ADMIN_COUNTRY', 'India'),
  };

  // Open a direct MongoDB connection for this one-time script.
  await mongoose.connect(env.MONGO_URI);

  /**
   * Reuse models if they already exist, otherwise create them.
   *
   * This avoids model re-registration problems when ts-node reloads files.
   */
  const EmployeeModel =
    mongoose.models.Employee || model('Employee', EmployeeSchema, 'employees');
  const UserModel =
    mongoose.models.UserDocument || model('UserDocument', UserSchema);

  /**
   * Check what already exists in the database.
   *
   * We intentionally check employee and user separately because:
   * - an employee record may exist
   * - but the login account may still be missing
   */
  const existingEmployeeById = (await EmployeeModel.findOne({
    'identity.emp_id': env.SEED_ADMIN_EMP_ID,
  }).lean()) as { identity?: { emp_id?: string } } | null;
  const existingEmployeeByEmail = (await EmployeeModel.findOne({
    'identity.email': env.SEED_ADMIN_EMAIL,
  }).lean()) as { identity?: { emp_id?: string } } | null;
  const existingUser = (await UserModel.findOne({
    employeeId: env.SEED_ADMIN_EMP_ID,
  }).lean()) as { employeeId?: string } | null;

  /**
   * Safety check:
   * if the email is already attached to a different employee ID,
   * stop immediately.
   *
   * This prevents us from accidentally linking the wrong identity
   * to the admin we are trying to seed.
   */
  if (
    existingEmployeeByEmail &&
    existingEmployeeByEmail.identity?.emp_id !== env.SEED_ADMIN_EMP_ID
  ) {
    throw new Error(
      `Email ${env.SEED_ADMIN_EMAIL} is already used by another employee`,
    );
  }

  /**
   * If both records already exist, the script has nothing to do.
   *
   * This is what makes the seed idempotent:
   * running it again does not keep creating duplicates.
   */
  if (existingEmployeeById && existingUser) {
    console.log(
      `Admin seed already exists for employee ID ${env.SEED_ADMIN_EMP_ID}`,
    );
    return;
  }

  /**
   * Create the employee record first if it does not exist yet.
   *
   * In this system, a user account must belong to an employee,
   * so the employee record is the foundation.
   */
  if (!existingEmployeeById) {
    const adminEmployee = Employee.create(
      EmployeeId.create(env.SEED_ADMIN_EMP_ID),
      {
        name: Name.create(env.SEED_ADMIN_FIRST_NAME, env.SEED_ADMIN_LAST_NAME),
        email: env.SEED_ADMIN_EMAIL,
        role: EmployeeRole.create('ADMIN'),
        addresses: [
          Address.create({
            type: AddressType.CURRENT,
            street: env.SEED_ADMIN_STREET,
            city: env.SEED_ADMIN_CITY,
            state: env.SEED_ADMIN_STATE,
            postalCode: env.SEED_ADMIN_POSTAL_CODE,
            country: env.SEED_ADMIN_COUNTRY,
          }),
          Address.create({
            type: AddressType.PERMANENT,
            street: env.SEED_ADMIN_STREET,
            city: env.SEED_ADMIN_CITY,
            state: env.SEED_ADMIN_STATE,
            postalCode: env.SEED_ADMIN_POSTAL_CODE,
            country: env.SEED_ADMIN_COUNTRY,
          }),
        ],
        managerId: null,
      },
    );

    await EmployeeModel.create(EmployeeMapper.toPersistence(adminEmployee));
    console.log(`Created admin employee ${env.SEED_ADMIN_EMP_ID}`);
  } else {
    console.log(`Employee ${env.SEED_ADMIN_EMP_ID} already exists, reusing it`);
  }

  /**
   * Create the login account if it is still missing.
   *
   * The User entity handles password hashing for us,
   * so we never store a plain-text password in the database.
   */
  if (!existingUser) {
    const adminUser = await User.create({
      employeeId: env.SEED_ADMIN_EMP_ID,
      plainPassword: env.SEED_ADMIN_PASSWORD,
    });

    await UserModel.create({
      userId: adminUser.id.getValue(),
      username: adminUser.username.getValue(),
      password: adminUser.password.getHash(),
      employeeId: adminUser.employeeId,
      status: adminUser.status,
      lastLoginAt: adminUser.lastLoginAt ?? null,
    });

    console.log(`Created admin login for ${env.SEED_ADMIN_EMP_ID}`);
  } else {
    console.log(
      `User ${env.SEED_ADMIN_EMP_ID} already exists, skipping login seed`,
    );
  }
}

/**
 * Run the script and always close the database connection.
 *
 * On success:
 * - disconnect cleanly
 *
 * On failure:
 * - print the error
 * - disconnect cleanly
 * - exit with a non-zero code so the terminal/CI knows it failed
 */
seedAdmin()
  .then(async () => {
    await mongoose.disconnect();
    console.log('Admin seeding completed');
  })
  .catch(async (error: unknown) => {
    console.error('Admin seeding failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
