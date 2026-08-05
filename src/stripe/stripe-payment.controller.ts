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
import { ReleasePayoutDto } from './dto/release-payout.dto';
import { StripePaymentService } from './stripe-payment.service';

@ApiTags('Stripe')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('stripe/payment-sheet')
export class StripePaymentController {
  constructor(private readonly stripePaymentService: StripePaymentService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Payment Sheet params to hold ask payment',
    description:
      'Asker only. Ask must have an assigned doer (`waiting` or later) and no held payment yet. ' +
      'Charges askie fee + platform fee to the platform (escrow). ' +
      'After the client payment succeeds, call `POST /stripe/payment-sheet/confirm`. ' +
      'Release to the doer later with `POST /stripe/payment-sheet/release` after `meet_complete`.',
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
    summary: 'Confirm escrow hold after Payment Sheet succeeds',
    description:
      'Asker only. Verifies the PaymentIntent succeeded and marks payment as held on the platform. ' +
      'Does not transfer to the doer yet.',
  })
  @ApiOkResponse({ type: ConfirmPaymentSheetResponseDto })
  confirmPaymentSheet(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: ConfirmPaymentSheetDto,
  ) {
    return this.stripePaymentService.confirmPaymentSheet(authUser.id, dto);
  }

  @Post('release')
  @ApiOperation({
    summary: 'Release held payout to the doer',
    description:
      'Asker only. Ask must be `meet_complete` with a held payment. ' +
      'Transfers the askie fee to the doer’s Connect account and sets status to `payout`. ' +
      'Platform fee remains on the platform.',
  })
  @ApiOkResponse({ type: ConfirmPaymentSheetResponseDto })
  releasePayout(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: ReleasePayoutDto,
  ) {
    return this.stripePaymentService.releasePayout(authUser.id, dto.askId);
  }
}
