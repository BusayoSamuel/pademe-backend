import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AskStatus } from '../entities/ask.entity';

export class UpdateAskStatusDto {
  @ApiProperty({
    enum: AskStatus,
    description:
      'Forward transitions: waiting→in_conversation→meet_complete→payout (payout: asker only)',
  })
  @IsEnum(AskStatus)
  status: AskStatus;
}
