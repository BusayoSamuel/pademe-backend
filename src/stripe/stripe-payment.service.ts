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
import { toIsoCountryCode } from '../common/country-iso.util';
import { Ask, AskStatus } from '../asks/entities/ask.entity';
import { User } from '../users/entities/user.entity';
import { ConfirmPaymentSheetDto } from './dto/confirm-payment-sheet.dto';
import { PaymentSheetResponseDto } from './dto/payment-sheet-response.dto';
import { STRIPE_CLIENT } from './stripe.constants';
import { toStripeUnitAmount } from './stripe-amount.util';
import type { StripeClient } from './stripe.types';
import Stripe from 'stripe';

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
    const asker = await this.findUserOrFail(ask.askerId);
    const doer = await this.findDoerOrFail(ask.doerId);
    const merchantCountryCode = this.toMerchantCountryCode(asker.country, ask.currency);

    if (!doer.stripeConnectAccountId) {
      throw new BadRequestException('Assigned doer has not connected Stripe payouts yet');
    }

    if (!doer.stripeChargesEnabled) {
      throw new BadRequestException('Assigned doer cannot receive payments yet');
    }

    const amount = Number(ask.amount);
    const currency = ask.currency.toLowerCase();

    let paymentIntent;
    try {
      paymentIntent = await this.stripe.paymentIntents.create({
        amount: toStripeUnitAmount(amount.toFixed(2), currency),
        currency,
        payment_method_types: ['card'],
        transfer_data: {
          destination: doer.stripeConnectAccountId,
        },
        metadata: {
          askId: ask.id,
          askerId: ask.askerId,
          doerId: ask.doerId ?? '',
        },
      });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(error.message);
      }

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
      merchantCountryCode,
    };
  }

  async confirmPaymentSheet(
    authUserId: string,
    dto: ConfirmPaymentSheetDto,
  ): Promise<{ askId: string; status: AskStatus }> {
    const ask = await this.findAskerOwnedAsk(authUserId, dto.askId);

    if (ask.status === AskStatus.Payout) {
      return {
        askId: ask.id,
        status: ask.status,
      };
    }

    if (ask.status !== AskStatus.MeetAndComplete) {
      throw new BadRequestException('Ask must be marked complete before payment');
    }

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

  private async findAskerOwnedAsk(authUserId: string, askId: string): Promise<Ask> {
    const ask = await this.asksRepo.findOne({ where: { id: askId } });
    if (!ask) {
      throw new NotFoundException('Ask not found');
    }

    if (ask.askerId !== authUserId) {
      throw new ForbiddenException('Only the asker can pay for this ask');
    }

    if (!ask.doerId) {
      throw new BadRequestException('Ask has no assigned doer');
    }

    return ask;
  }

  private async findPayableAsk(authUserId: string, askId: string): Promise<Ask> {
    const ask = await this.findAskerOwnedAsk(authUserId, askId);

    if (ask.status !== AskStatus.MeetAndComplete) {
      throw new BadRequestException('Ask must be marked complete before payment');
    }

    return ask;
  }

  private async findUserOrFail(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private toMerchantCountryCode(country: string, currency: string): string {
    try {
      return toIsoCountryCode(country);
    } catch {
      const currencyCountryMap: Record<string, string> = {
        gbp: 'GB',
        usd: 'US',
        eur: 'IE',
      };

      return currencyCountryMap[currency.toLowerCase()] ?? 'GB';
    }
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
