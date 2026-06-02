import { ApiProperty } from '@nestjs/swagger';

export class StorageSignedUrlResponseDto {
  @ApiProperty({
    description: 'Temporary URL to download the file',
  })
  signedUrl: string;
}
