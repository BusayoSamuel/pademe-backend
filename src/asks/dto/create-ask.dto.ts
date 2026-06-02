import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  IsDateString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { AskUrgency } from '../entities/ask.entity';

export class CreateAskDto {
  @ApiProperty({ example: 'Help moving furniture' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Need help moving a couch to the second floor.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ example: 'Lagos, Ikeja' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location: string;

  @ApiProperty({ example: 15000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: 'NGN',
    description: 'ISO 4217 currency code (3 uppercase letters)',
  })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code (e.g. NGN, USD)' })
  currency: string;

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ enum: AskUrgency, example: AskUrgency.Medium })
  @IsEnum(AskUrgency)
  urgency: AskUrgency;

  @ApiProperty({
    format: 'uuid',
    description: 'Must match the authenticated user (asker)',
  })
  @IsUUID()
  askerId: string;
}
