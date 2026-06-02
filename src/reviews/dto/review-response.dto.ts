import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewType } from '../entities/review.entity';

export class ReviewResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 4.5 })
  rating: number;

  @ApiProperty()
  notes: string;

  @ApiPropertyOptional({ nullable: true })
  photoPath: string | null;

  @ApiPropertyOptional({ nullable: true })
  photoUrl: string | null;

  @ApiProperty({ enum: ReviewType })
  type: ReviewType;

  @ApiProperty({ format: 'uuid' })
  revieweeId: string;

  @ApiProperty({ format: 'uuid' })
  reviewerId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
