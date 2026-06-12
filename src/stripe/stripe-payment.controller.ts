import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { User as AuthUser } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SWAGGER_BEARER_AUTH } from '../swagger/swagger.config';
import { ConfirmPaymentSheetDto } from './dto/confirm-payment-sheet.dto';
import { CreatePaymentSheetDto } from './dto/create-payment-sheet.dto';
import { PaymentSheetResponseDto } from './dto/payment-sheet-response.dto';
import { StripePaymentService } from './stripe-payment.service';

@ApiTags('Stripe')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('stripe/payment-sheet')
export class StripePaymentController {
  constructor(private readonly stripePaymentService: StripePaymentService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Stripe Payment Sheet params for an ask payout',
    description:
      'Asker only. Ask must be in meet_complete status. Returns PaymentIntent client secret for the mobile Payment Sheet.',
  })
  @ApiCreatedResponse({ type: PaymentSheetResponseDto })
  createPaymentSheet(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreatePaymentSheetDto,
  ) {
    return this.stripePaymentService.createPaymentSheet(authUser.id, dto.askId);
  }

  @Post('confirm')
  @ApiOperation({
    summary: 'Confirm ask payout after Payment Sheet succeeds',
    description:
      'Verifies the PaymentIntent succeeded and advances the ask to payout status.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        askId: { type: 'string', format: 'uuid' },
        status: { type: 'string', example: 'payout' },
      },
    },
  })
  confirmPaymentSheet(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: ConfirmPaymentSheetDto,
  ) {
    return this.stripePaymentService.confirmPaymentSheet(authUser.id, dto);
  }
}
