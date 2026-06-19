import { User, UserStatus } from '../../../domain/entities/user.entity';
import { UserDocument } from './user.schema';

export class UserMapper {
  static toDomain(raw: UserDocument): User {
    return User.fromPersistence({
      id: raw.userId,
      username: raw.username,
      hashedPassword: raw.password,
      employeeId: raw.employeeId,
      status: raw.status as UserStatus,
      createdAt: raw.createdAt,
      lastLoginAt: raw.lastLoginAt,
    });
  }

  static toPersistence(user: User): any {
    return {
      userId: user.id.getValue(),
      username: user.username.getValue(),
      password: user.password.getHash(),
      employeeId: user.employeeId,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
