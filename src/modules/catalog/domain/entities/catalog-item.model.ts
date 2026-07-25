import { ObjectType, Field, Float, ID } from '@nestjs/graphql';

@ObjectType()
export class CatalogItem {
  @Field(() => ID)
  _id: string;

  @Field()
  name: string;

  @Field()
  category: string; // e.g., 'Lighting', 'Modular Kitchen'

  @Field(() => Float)
  price: number;

  @Field()
  material: string;

  @Field()
  inStock: boolean;
}
