import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ask, AskStatus } from '../asks/entities/ask.entity';
import { User } from '../users/entities/user.entity';
import { ConfirmPaymentSheetDto } from './dto/confirm-payment-sheet.dto';
import { PaymentSheetResponseDto } from './dto/payment-sheet-response.dto';
import { STRIPE_CLIENT } from './stripe.constants';
import { toStripeUnitAmount } from './stripe-amount.util';
import type { StripeClient } from './stripe.types';

const SERVICE_FEE_RATE = 0.1;

@Injectable()
export class StripePaymentService {
  constructor(
    @Inject(STRIPE_CLIENT)
    private readonly stripe: StripeClient,
    private readonly config: ConfigService,
    @InjectRepository(Ask)
    private readonly asksRepo: Repository<Ask>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async createPaymentSheet(
    authUserId: string,
    askId: string,
  ): Promise<PaymentSheetResponseDto> {
    const ask = await this.findPayableAsk(authUserId, askId);
    const doer = await this.findDoerOrFail(ask.doerId);

    if (!doer.stripeConnectAccountId) {
      throw new BadRequestException('Assigned doer has not connected Stripe payouts yet');
    }

    if (!doer.stripeChargesEnabled) {
      throw new BadRequestException('Assigned doer cannot receive payments yet');
    }

    const budget = Number(ask.amount);
    const serviceFee = Math.round(budget * SERVICE_FEE_RATE);
    const total = budget + serviceFee;
    const currency = ask.currency.toLowerCase();

    let paymentIntent;
    try {
      paymentIntent = await this.stripe.paymentIntents.create({
        amount: toStripeUnitAmount(total.toFixed(2), currency),
        currency,
        automatic_payment_methods: { enabled: true },
        application_fee_amount: toStripeUnitAmount(serviceFee.toFixed(2), currency),
        transfer_data: {
          destination: doer.stripeConnectAccountId,
        },
        metadata: {
          askId: ask.id,
          askerId: ask.askerId,
          doerId: ask.doerId ?? '',
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to create Stripe payment intent');
    }

    if (!paymentIntent.client_secret) {
      throw new InternalServerErrorException('Stripe did not return a payment intent secret');
    }

    const publishableKey = this.config.get<string>('stripe.publishableKey');
    if (!publishableKey) {
      throw new InternalServerErrorException('STRIPE_PUBLISHABLE_KEY is not configured');
    }

    return {
      publishableKey,
      paymentIntentId: paymentIntent.id,
      paymentIntentClientSecret: paymentIntent.client_secret,
    };
  }

  async confirmPaymentSheet(
    authUserId: string,
    dto: ConfirmPaymentSheetDto,
  ): Promise<{ askId: string; status: AskStatus }> {
    const ask = await this.findPayableAsk(authUserId, dto.askId);

    let paymentIntent;
    try {
      paymentIntent = await this.stripe.paymentIntents.retrieve(dto.paymentIntentId);
    } catch {
      throw new BadRequestException('Payment intent not found');
    }

    if (paymentIntent.metadata.askId !== ask.id) {
      throw new BadRequestException('Payment intent does not match this ask');
    }

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Payment has not completed yet');
    }

    ask.status = AskStatus.Payout;
    const saved = await this.asksRepo.save(ask);

    return {
      askId: saved.id,
      status: saved.status,
    };
  }

  private async findPayableAsk(authUserId: string, askId: string): Promise<Ask> {
    const ask = await this.asksRepo.findOne({ where: { id: askId } });
    if (!ask) {
      throw new NotFoundException('Ask not found');
    }

    if (ask.askerId !== authUserId) {
      throw new ForbiddenException('Only the asker can pay for this ask');
    }

    if (ask.status !== AskStatus.MeetAndComplete) {
      throw new BadRequestException('Ask must be marked complete before payment');
    }

    if (!ask.doerId) {
      throw new BadRequestException('Ask has no assigned doer');
    }

    return ask;
  }

  private async findDoerOrFail(doerId: string | null): Promise<User> {
    if (!doerId) {
      throw new BadRequestException('Ask has no assigned doer');
    }

    const doer = await this.usersRepo.findOne({ where: { id: doerId } });
    if (!doer) {
      throw new NotFoundException('Doer not found');
    }

    return doer;
  }
}
