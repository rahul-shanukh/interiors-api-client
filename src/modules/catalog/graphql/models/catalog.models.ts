import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class Category {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;
}

@ObjectType()
export class ProductImage {
  @Field()
  url: string;

  @Field({ nullable: true })
  alt?: string;
}

@ObjectType()
export class Product {
  @Field(() => ID)
  id: string;

  @Field()
  sku: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  price: number;

  @Field(() => [ProductImage])
  images: ProductImage[];

  @Field(() => Category)
  category: Category;
}
