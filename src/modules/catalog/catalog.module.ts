import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  CategoryEntity,
  CategorySchema,
  ProductEntity,
  ProductSchema,
} from "./infrastructure/persistence/mongo/catalog.schema";
import { CatalogSeeder } from "./infrastructure/persistence/mongo/database/catalog.seeder";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductEntity.name, schema: ProductSchema },
      { name: CategoryEntity.name, schema: CategorySchema },
    ]),
  ],
  providers: [CatalogSeeder],
})
export class CatalogModule {}
