//src/modules/user/user.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  UserDocument,
  UserSchema,
} from "./infrastructure/persistence/mongo/user.schema";
import { UserService } from "./application/services/user.service";
import { UserMongoRepository } from "./infrastructure/persistence/mongo/user.mongo.repository";
import { DeleteUserService } from "./application/services/delete-user.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
    ]),
  ],
  // controllers: [UserController],
  providers: [
    UserService,
    DeleteUserService,
    {
      provide: "UserRepository",
      useClass: UserMongoRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
