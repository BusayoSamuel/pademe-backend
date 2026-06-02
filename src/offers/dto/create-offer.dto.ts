import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

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
}
