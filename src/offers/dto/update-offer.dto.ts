import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateOfferDto {
  @ApiPropertyOptional({ example: 'Updated: available Monday morning too.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  note?: string;

  @ApiPropertyOptional({
    example: 140,
    description: 'Offer amount; must be greater than 0',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;
}
