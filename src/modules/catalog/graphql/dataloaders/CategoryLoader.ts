import { Injectable, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import DataLoader from 'dataloader';
import { CategoryEntity } from '../../infrastructure/persistence/mongo/catalog.schema';
@Injectable({ scope: Scope.REQUEST })
export class CategoryLoader {
  constructor(
    // 👉 Inject the Mongoose Category Model
    @InjectModel(CategoryEntity.name)
    private readonly categoryModel: Model<CategoryEntity>,
  ) {}

  public readonly batchCategories = new DataLoader<string, any>(
    async (categoryIds: readonly string[]) => {
      // 1. THE BATCH FETCH: Grab all categories matching the grouped IDs from MongoDB
      const categories = await this.categoryModel
        .find({
          _id: { $in: categoryIds as string[] },
        })
        .exec();

      // 2. THE MAPPING: Mongoose uses `_id` which is an ObjectId.
      // We convert it to a string so the Map perfectly matches the incoming strings.
      const categoryMap = new Map(
        categories.map((cat) => [cat._id.toString(), cat]),
      );

      // 3. Return them in the exact order GraphQL requested
      return categoryIds.map((id) => categoryMap.get(id.toString()) || null);
    },
  );
}
