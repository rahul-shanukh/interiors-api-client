import { ArgsType, Field, Float } from '@nestjs/graphql';

@ArgsType()
export class CatalogFilterArgs {
  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  material?: string;

  @Field(() => Float, { nullable: true })
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  maxPrice?: number;
}
