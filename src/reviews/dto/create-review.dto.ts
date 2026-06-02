import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ReviewType } from '../entities/review.entity';

export class CreateReviewDto {
  @ApiProperty({ example: 4.5, minimum: 1, maximum: 5 })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great communication and finished on time.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  notes: string;

  @ApiPropertyOptional({ description: 'Storage path if already uploaded' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoPath?: string;

  @ApiProperty({ enum: ReviewType, example: ReviewType.Doer })
  @IsEnum(ReviewType)
  type: ReviewType;

  @ApiProperty({
    format: 'uuid',
    description: 'User being reviewed',
  })
  @IsUUID()
  revieweeId: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Must match the authenticated user (reviewer)',
  })
  @IsUUID()
  reviewerId: string;
}
