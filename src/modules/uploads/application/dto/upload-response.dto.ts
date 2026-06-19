import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlResponseDto {
  @ApiProperty({
    example:
      'https://storage.example.com/catalog/images/kitchen/file.webp?signature=...',
    description: 'Temporary URL used by the client to upload the file.',
  })
  uploadUrl!: string;

  @ApiProperty({
    example: 'https://cdn.example.com/catalog/images/kitchen/file.webp',
    description: 'Public URL where the uploaded asset will be available.',
  })
  publicUrl!: string;

  @ApiProperty({
    example: 'catalog/images/kitchen/681ef9c6-file.webp',
    description: 'Storage object key for the uploaded file.',
  })
  fileKey!: string;
}

export class ConfirmUploadResponseDto {
  @ApiProperty({
    example: 'catalog/images/kitchen/681ef9c6-file.webp',
    description: 'Storage object key that was confirmed.',
  })
  fileKey!: string;

  @ApiProperty({
    example: 'https://cdn.example.com/catalog/images/kitchen/file.webp',
    description: 'Public URL for the confirmed asset.',
  })
  publicUrl!: string;

  @ApiProperty({
    example: 'confirmed',
    description: 'Asset status after confirmation.',
  })
  status!: string;
}
