import { User } from '../entities/user.entity';

// Repository interface defines the contract for user data access
// The actual implementation will be in the infrastructure layer with MongoDB
export interface UserRepository {
  save(user: User): Promise<User>;
  findByUsername(username: string): Promise<User | null>;
  findByEmployeeId(employeeId: string): Promise<User | null>;
  existsByEmployeeId(employeeId: string): Promise<boolean>;
  deleteByUserId(employeeId: string): Promise<boolean>;
  updateLastLogin(userId: string, lastLogin: Date): Promise<void>;
}
