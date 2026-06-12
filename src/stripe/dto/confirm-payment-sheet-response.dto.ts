import { ApiProperty } from '@nestjs/swagger';
import { AskStatus } from '../../asks/entities/ask.entity';

export class ConfirmPaymentSheetResponseDto {
  @ApiProperty({ format: 'uuid' })
  askId: string;

  @ApiProperty({ enum: AskStatus, example: AskStatus.Payout })
  status: AskStatus;
}
