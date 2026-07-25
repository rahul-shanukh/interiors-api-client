import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql'; // Added Mutation and ID
import { QueryBus } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose'; // Added this
import { Model } from 'mongoose'; // Added this
import { GetCatalogQuery } from '../queries/handlers/GetCatalogHandler';
import { Product } from '../graphql/models/catalog.models';
import { ProductEntity } from '../infrastructure/persistence/mongo/catalog.schema';
import { Public } from 'src/common/decorators/roles.decorator';

@Resolver(() => Product)
export class CatalogResolver {
  constructor(
    private readonly queryBus: QueryBus,
    // 👇 You MUST inject the model here to use it in addProductImage
    @InjectModel(ProductEntity.name)
    private readonly productModel: Model<ProductEntity>,
  ) {}

  @Public()
  @Query(() => [Product], { name: 'getCatalog' })
  async getCatalog(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ) {
    const query = new GetCatalogQuery(limit, offset);
    return this.queryBus.execute(query);
  }

  @Public() // 👈 Added so you can test without a token
  @Mutation(() => Product)
  async addProductImage(
    @Args('productId', { type: () => ID }) productId: string,
    @Args('imageUrl') imageUrl: string,
    @Args('altText', { nullable: true }) altText?: string,
  ) {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(
        productId,
        {
          $push: {
            images: { url: imageUrl, alt: altText || 'Product Image' },
          },
        },
        { new: true },
      )
      .exec();

    return updatedProduct;
  }
}
