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

  @ApiProperty({ example: 150 })
  amount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
