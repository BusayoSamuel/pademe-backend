import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ReleasePayoutDto {
  @ApiProperty({ format: 'uuid', description: 'Ask to release held payout for' })
  @IsUUID()
  askId: string;
}
