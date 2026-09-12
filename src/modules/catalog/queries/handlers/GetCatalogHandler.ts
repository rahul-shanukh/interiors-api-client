import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductEntity } from '../../infrastructure/persistence/mongo/catalog.schema';

// 1. The Query Definition
export class GetCatalogQuery {
  constructor(
    public readonly limit: number = 20,
    public readonly offset: number = 0,
  ) {}
}

// 2. The Query Handler
@QueryHandler(GetCatalogQuery)
export class GetCatalogHandler implements IQueryHandler<GetCatalogQuery> {
  // 👉 Inject the Mongoose Model we just registered in the CatalogModule
  constructor(
    @InjectModel(ProductEntity.name)
    private readonly productModel: Model<ProductEntity>,
  ) {}

  // 3. The Execution Logic
  async execute(query: GetCatalogQuery) {
    const { limit, offset } = query;

    // 👉 Execute the real query against your MongoDB Atlas cluster
    const products = await this.productModel
      .find()
      .skip(offset)
      .limit(limit)
      .exec();

    return products;
  }
}
