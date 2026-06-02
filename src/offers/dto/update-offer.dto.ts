import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateOfferDto {
  @ApiProperty({ example: 'Updated: available Monday morning too.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  note: string;
}
