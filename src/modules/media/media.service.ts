import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class MediaService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicDomain: string;

  constructor(private configService: ConfigService) {
    // 👉 Changed 'get' to 'getOrThrow' everywhere
    const accountId = this.configService.getOrThrow<string>("R2_ACCOUNT_ID");
    this.bucketName = this.configService.getOrThrow<string>("R2_BUCKET_NAME");
    this.publicDomain =
      this.configService.getOrThrow<string>("R2_PUBLIC_DOMAIN");

    // Configure the AWS SDK to talk to Cloudflare R2
    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>("R2_ACCESS_KEY_ID"),
        secretAccessKey: this.configService.getOrThrow<string>(
          "R2_SECRET_ACCESS_KEY",
        ),
      },
    });
  }

  // ... keep the generateUploadUrl method exactly the same

  async generateUploadUrl(originalFilename: string, contentType: string) {
    try {
      // 1. Create a unique, web-safe filename so images don't overwrite each other
      const fileExtension = originalFilename.split(".").pop();
      const uniqueFilename = `catalog/${uuidv4()}.${fileExtension}`;

      // 2. Prepare the exact S3 command the frontend is allowed to execute
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueFilename,
        ContentType: contentType,
      });

      // 3. Generate the secure URL (expires in 15 minutes)
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 900,
      });

      return {
        // The frontend uses this URL to do the actual PUT request
        uploadUrl: signedUrl,
        // You save THIS URL to your MongoDB product document!
        publicUrl: `${this.publicDomain}/${uniqueFilename}`,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        "Failed to generate secure upload URL",
        error.message,
      );
    }
  }
}
