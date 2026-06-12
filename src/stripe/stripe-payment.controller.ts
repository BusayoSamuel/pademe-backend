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
import { ConfirmPaymentSheetResponseDto } from './dto/confirm-payment-sheet-response.dto';
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
    summary: 'Create Payment Sheet params for an ask',
    description:
      'Asker only. Ask must be `meet_complete` with an assigned doer who has completed Stripe Connect onboarding. ' +
      'Creates a Connect destination charge (ask budget + 10% service fee) for card and Apple Pay via the mobile Payment Sheet. ' +
      'Returns params for the mobile Payment Sheet, including `merchantCountryCode` for Apple Pay. ' +
      'After the client payment succeeds, call `POST /stripe/payment-sheet/confirm`.',
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
      'Asker only. Verifies the PaymentIntent succeeded, matches it to the ask, and advances ask status to `payout`.',
  })
  @ApiOkResponse({ type: ConfirmPaymentSheetResponseDto })
  confirmPaymentSheet(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: ConfirmPaymentSheetDto,
  ) {
    return this.stripePaymentService.confirmPaymentSheet(authUser.id, dto);
  }
}
