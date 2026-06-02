import { ApiProperty } from '@nestjs/swagger';

export class CompletedAsksCountDto {
  @ApiProperty({ format: 'uuid' })
  doerId: string;

  @ApiProperty({
    description: 'Asks where this user is doer and status is payout',
    example: 12,
  })
  completedCount: number;
}
