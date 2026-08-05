import { ApiProperty } from '@nestjs/swagger';

export class LikeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  askId: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({
    example: 3,
    description: 'Total likes on this ask after the action',
  })
  likeCount: number;

  @ApiProperty()
  createdAt: Date;
}

export class UnlikeResponseDto {
  @ApiProperty({ format: 'uuid' })
  askId: string;

  @ApiProperty({
    example: 2,
    description: 'Total likes on this ask after the unlike',
  })
  likeCount: number;

  @ApiProperty({ example: true })
  deleted: boolean;
}
