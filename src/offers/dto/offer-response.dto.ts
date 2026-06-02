import { ApiProperty } from '@nestjs/swagger';

export class OfferResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  askId: string;

  @ApiProperty({ format: 'uuid' })
  doerId: string;

  @ApiProperty()
  note: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
