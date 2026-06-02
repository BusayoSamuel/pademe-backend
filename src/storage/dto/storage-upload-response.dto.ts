import { ApiProperty } from '@nestjs/swagger';

export class StorageUploadResponseDto {
  @ApiProperty({ example: 'uploads' })
  bucket: string;

  @ApiProperty({
    example: 'user-uuid/550e8400-e29b-41d4-a716-446655440000.jpg',
  })
  path: string;

  @ApiProperty({
    example:
      'https://your-project.supabase.co/storage/v1/object/public/uploads/user-uuid/file.jpg',
  })
  publicUrl: string;
}
