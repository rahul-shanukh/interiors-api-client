import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class DeleteUserService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(employeeId: string): Promise<{ message: string }> {
    const isDeleted = await this.userRepository.deleteByUserId(employeeId);

    if (!isDeleted) {
      throw new NotFoundException('User with ID ${userId} not found');
    }

    return {
      message: 'User deleted SUCCESSFULLY',
    };
  }
}
