import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ConfirmPaymentSheetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  askId: string;

  @ApiProperty({ example: 'pi_...' })
  @IsString()
  paymentIntentId: string;
}
