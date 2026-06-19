import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // 1. Add this
import {
  UserDocument,
  UserSchema,
} from './infrastructure/persistence/mongo/user.schema'; // 2. Add this (adjust path if needed)
import { UserController } from './controllers/user.controller';
import { UserService } from './application/services/user.service';
import { EmployeeModule } from '../employee/employee.module';
import { UserMongoRepository } from './infrastructure/persistence/mongo/user.mongo.repository';
import { DeleteUserService } from './application/services/delete-user.service';

@Module({
  imports: [
    EmployeeModule,

    // 3. ADD THIS BLOCK: It registers the User schema so the repository can use it
    MongooseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    DeleteUserService,
    {
      provide: 'UserRepository',
      useClass: UserMongoRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
