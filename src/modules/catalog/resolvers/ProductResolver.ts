import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { CategoryLoader } from '../graphql/dataloaders/CategoryLoader';
import { Product, Category } from '../graphql/models/catalog.models';
@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly categoryLoader: CategoryLoader) {}

  @ResolveField(() => Category)
  async category(@Parent() product: any) {
    // 👉 Grab the categoryId from the Mongoose document and convert it to a string
    const categoryId = product.categoryId?.toString();

    if (!categoryId) return null;

    // Pass the string ID to your new MongoDB DataLoader
    return this.categoryLoader.batchCategories.load(categoryId);
  }

  // 👉 Bonus: Mongoose uses `_id`, but GraphQL wants `id`. This maps it automatically!
  @ResolveField(() => String)
  id(@Parent() product: any) {
    return product._id.toString();
  }
}
