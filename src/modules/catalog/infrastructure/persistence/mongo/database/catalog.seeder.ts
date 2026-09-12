import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductEntity, CategoryEntity } from '../catalog.schema';

@Injectable()
export class CatalogSeeder implements OnModuleInit {
  private readonly logger = new Logger(CatalogSeeder.name);

  constructor(
    @InjectModel(ProductEntity.name) private productModel: Model<ProductEntity>,
    @InjectModel(CategoryEntity.name)
    private categoryModel: Model<CategoryEntity>,
  ) {}

  // This runs automatically exactly once when the server starts
  async onModuleInit() {
    const count = await this.categoryModel.countDocuments();

    // If we already have data, skip seeding
    if (count > 0) {
      this.logger.log('Database already seeded. Skipping...');
      return;
    }

    this.logger.log(
      'Empty database detected. Seeding JC Interiors mock data...',
    );

    // 1. Create the Categories
    const furniture = await this.categoryModel.create({
      name: 'Furniture',
      slug: 'furniture',
    });
    const lighting = await this.categoryModel.create({
      name: 'Lighting',
      slug: 'lighting',
    });

    // 2. Create the Products and link them via categoryId
    await this.productModel.create([
      {
        sku: 'FURN-OAK-TBL-01',
        name: 'Minimalist Oak Dining Table',
        slug: 'minimalist-oak-dining-table',
        description:
          'A beautiful handcrafted solid oak table perfect for modern dining rooms.',
        price: 1250.0,
        categoryId: furniture._id, // Relational Link!
        images: [
          {
            url: 'https://placehold.co/800x600/e2e8f0/475569?text=Oak+Table+Main',
            alt: 'Oak Table',
          },
        ],
      },
      {
        sku: 'LIGH-BRS-PND-01',
        name: 'Brushed Brass Pendant Light',
        slug: 'brushed-brass-pendant-light',
        description:
          'Elegant drop pendant lighting to elevate your kitchen island.',
        price: 345.5,
        categoryId: lighting._id, // Relational Link!
        images: [
          {
            url: 'https://placehold.co/800x600/e2e8f0/475569?text=Brass+Pendant',
            alt: 'Brass Pendant',
          },
        ],
      },
    ]);

    this.logger.log('Seeding Complete! You can now run GraphQL queries.');
  }
}
