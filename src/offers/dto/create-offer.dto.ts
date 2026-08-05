import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateOfferDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  askId: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Must match the authenticated user (doer)',
  })
  @IsUUID()
  doerId: string;

  @ApiProperty({ example: 'I can help this weekend. I have a van.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  note: string;

  @ApiProperty({
    example: 150,
    description: 'Offer amount; must be greater than 0',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;
}
