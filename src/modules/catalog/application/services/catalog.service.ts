import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogItemDocument } from 'src/modules/reviews/infrastructure/persistence/mongo/catalog.schema';
import { CatalogFilterArgs } from '../dto/catalog-filter.args';

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel('CatalogItem')
    private catalogModel: Model<CatalogItemDocument>,
  ) {}

  async findAll(filters: CatalogFilterArgs) {
    const query: any = {};

    // 1. Dynamically build the MongoDB query based on provided filters
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.material) {
      query.material = filters.material;
    }
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = filters.minPrice;
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }

    // 2. Fetch the raw documents from MongoDB
    const rawItems = await this.catalogModel.find(query).exec();

    // 🚀 3. THE FIX: Map the Mongoose documents to perfectly match the GraphQL model
    return rawItems.map((item) => ({
      _id: item._id.toString(), // Convert the ObjectId to a standard string!
      name: item.name,
      category: item.category,
      price: item.price,
      material: item.material,
      inStock: item.inStock,
    }));
  }
}
