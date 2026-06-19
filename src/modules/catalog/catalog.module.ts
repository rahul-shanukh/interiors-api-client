import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// 1. Import Resolvers (The GraphQL entry points)
import { CatalogResolver } from './resolvers/CatalogResolver';
import { ProductResolver } from './resolvers/ProductResolver';
import { GetCatalogHandler } from './queries/handlers/GetCatalogHandler';

// 3. Import DataLoaders (The speed engine)
import { CategoryLoader } from './graphql/dataloaders/CategoryLoader';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CategoryEntity,
  CategorySchema,
  ProductEntity,
  ProductSchema,
} from './infrastructure/persistence/mongo/catalog.schema';
import { CatalogSeeder } from './infrastructure/persistence/mongo/database/catalog.seeder';

// Group your handlers in an array. As you add more (like GetProductByIdHandler),
// you just add them to this array to keep the module clean.
const QueryHandlers = [GetCatalogHandler];

@Module({
  imports: [
    // CRITICAL: You must import the CqrsModule so the QueryBus works!
    CqrsModule,
    MongooseModule.forFeature([
      { name: ProductEntity.name, schema: ProductSchema },
      { name: CategoryEntity.name, schema: CategorySchema },
    ]),
  ],
  providers: [
    // Register Resolvers
    CatalogResolver,
    ProductResolver,
    GetCatalogHandler,
    // Register DataLoaders
    CategoryLoader,

    CatalogSeeder,
    // Register all CQRS Handlers
    ...QueryHandlers,
  ],
})
export class CatalogModule {}
