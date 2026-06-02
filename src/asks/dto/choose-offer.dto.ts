import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ChooseOfferDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Offer to accept; doer_id is taken from this offer',
  })
  @IsUUID()
  offerId: string;
}
