import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { StripeService } from './stripe.service';

@ApiTags('Stripe')
@ApiExcludeController()
@Controller('stripe/webhooks')
export class StripeWebhookController {
  constructor(private readonly stripeService: StripeService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw request body');
    }

    const event = this.stripeService.constructWebhookEvent(rawBody, signature);

    switch (event.type) {
      case 'account.updated':
        await this.stripeService.handleAccountUpdated(event.data.object);
        break;
      default:
        break;
    }

    return { received: true };
  }
}
