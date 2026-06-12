import { ApiProperty } from '@nestjs/swagger';

export class PaymentSheetResponseDto {
  @ApiProperty({ example: 'pk_test_...' })
  publishableKey: string;

  @ApiProperty({ example: 'pi_...' })
  paymentIntentId: string;

  @ApiProperty({ example: 'pi_..._secret_...' })
  paymentIntentClientSecret: string;
}
