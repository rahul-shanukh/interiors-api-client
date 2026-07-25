import { Resolver, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { MediaService } from './media.service';
import { Public } from 'src/common/decorators/roles.decorator';

// The response object NestJS will generate in the schema
@ObjectType()
export class SignedUrlResponse {
  @Field()
  uploadUrl: string;

  @Field()
  publicUrl: string;
}

@Resolver()
export class MediaResolver {
  constructor(private readonly mediaService: MediaService) {}

  @Public() // This endpoint is public, no auth required
  @Mutation(() => SignedUrlResponse)
  async getSignedUploadUrl(
    @Args('filename') filename: string,
    @Args('contentType') contentType: string,
  ) {
    return this.mediaService.generateUploadUrl(filename, contentType);
  }
}
