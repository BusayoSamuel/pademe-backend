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
import { Offer } from '../offers/entities/offer.entity';
import { User } from '../users/entities/user.entity';
import { ConfirmPaymentSheetDto } from './dto/confirm-payment-sheet.dto';
import { PaymentSheetResponseDto } from './dto/payment-sheet-response.dto';
import { calculatePaymentTotal } from './platform-fee.util';
import { STRIPE_CLIENT } from './stripe.constants';
import { toStripeUnitAmount } from './stripe-amount.util';
import type { StripeClient } from './stripe.types';
import Stripe from 'stripe';

const HOLDABLE_STATUSES: AskStatus[] = [
  AskStatus.Waiting,
  AskStatus.InConversation,
  AskStatus.MeetAndComplete,
];

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
    @InjectRepository(Offer)
    private readonly offersRepo: Repository<Offer>,
  ) {}

  /**
   * Charge asker for askie fee + platform fee. Funds stay on the platform
   * until `releasePayout` after the ask is marked complete.
   */
  async createPaymentSheet(
    authUserId: string,
    askId: string,
  ): Promise<PaymentSheetResponseDto> {
    const ask = await this.findHoldableAsk(authUserId, askId);
    const asker = await this.findUserOrFail(ask.askerId);
    const merchantCountryCode = this.toMerchantCountryCode(
      asker.country,
      ask.currency,
    );

    const askieFee = await this.resolveAskieFee(ask);
    const { platformFee, total } = calculatePaymentTotal(askieFee);
    const currency = ask.currency.toLowerCase();

    let paymentIntent;
    try {
      paymentIntent = await this.stripe.paymentIntents.create({
        amount: toStripeUnitAmount(total.toFixed(2), currency),
        currency,
        transfer_group: ask.id,
        metadata: {
          askId: ask.id,
          askerId: ask.askerId,
          doerId: ask.doerId ?? '',
          askieFee: askieFee.toFixed(2),
          platformFee: platformFee.toFixed(2),
          purpose: 'ask_escrow_hold',
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

  /**
   * After Payment Sheet succeeds: mark funds as held on the platform.
   * Does not transfer to the doer or set status to payout.
   */
  async confirmPaymentSheet(
    authUserId: string,
    dto: ConfirmPaymentSheetDto,
  ): Promise<{ askId: string; status: AskStatus; paymentHeld: boolean }> {
    const ask = await this.findAskerOwnedAsk(authUserId, dto.askId);

    if (ask.paymentHeld) {
      return {
        askId: ask.id,
        status: ask.status,
        paymentHeld: true,
      };
    }

    if (!HOLDABLE_STATUSES.includes(ask.status)) {
      throw new BadRequestException(
        'Ask must have an assigned doer before payment can be held',
      );
    }

    let paymentIntent;
    try {
      paymentIntent = await this.stripe.paymentIntents.retrieve(
        dto.paymentIntentId,
      );
    } catch {
      throw new BadRequestException('Payment intent not found');
    }

    if (paymentIntent.metadata.askId !== ask.id) {
      throw new BadRequestException('Payment intent does not match this ask');
    }

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Payment has not completed yet');
    }

    const askieFee = Number(
      paymentIntent.metadata.askieFee ?? (await this.resolveAskieFee(ask)),
    );
    const platformFee = Number(
      paymentIntent.metadata.platformFee ??
        calculatePaymentTotal(askieFee).platformFee,
    );

    ask.stripePaymentIntentId = paymentIntent.id;
    ask.paymentHeld = true;
    ask.askieFeeAmount = askieFee.toFixed(2);
    ask.platformFeeAmount = platformFee.toFixed(2);
    const saved = await this.asksRepo.save(ask);

    return {
      askId: saved.id,
      status: saved.status,
      paymentHeld: true,
    };
  }

  /**
   * After ask is meet_complete and payment is held: transfer askie fee to doer.
   */
  async releasePayout(
    authUserId: string,
    askId: string,
  ): Promise<{ askId: string; status: AskStatus }> {
    const ask = await this.findAskerOwnedAsk(authUserId, askId);

    if (ask.status === AskStatus.Payout) {
      return { askId: ask.id, status: ask.status };
    }

    if (ask.status !== AskStatus.MeetAndComplete) {
      throw new BadRequestException(
        'Ask must be marked complete before releasing payout',
      );
    }

    if (!ask.paymentHeld || !ask.stripePaymentIntentId) {
      throw new BadRequestException(
        'Payment must be held before releasing payout',
      );
    }

    if (ask.stripeTransferId) {
      ask.status = AskStatus.Payout;
      const saved = await this.asksRepo.save(ask);
      return { askId: saved.id, status: saved.status };
    }

    const doer = await this.findDoerOrFail(ask.doerId);

    if (!doer.stripeConnectAccountId) {
      throw new BadRequestException(
        'Assigned doer has not connected Stripe payouts yet',
      );
    }

    if (!doer.stripePayoutsEnabled && !doer.stripeChargesEnabled) {
      throw new BadRequestException(
        'Assigned doer cannot receive payouts yet',
      );
    }

    const askieFee = Number(ask.askieFeeAmount ?? ask.amount);
    const currency = ask.currency.toLowerCase();

    let paymentIntent;
    try {
      paymentIntent = await this.stripe.paymentIntents.retrieve(
        ask.stripePaymentIntentId,
      );
    } catch {
      throw new BadRequestException('Held payment intent not found');
    }

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Held payment is not in a succeeded state');
    }

    const chargeId =
      typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge?.id;

    let transfer;
    try {
      transfer = await this.stripe.transfers.create({
        amount: toStripeUnitAmount(askieFee.toFixed(2), currency),
        currency,
        destination: doer.stripeConnectAccountId,
        transfer_group: ask.id,
        ...(chargeId ? { source_transaction: chargeId } : {}),
        metadata: {
          askId: ask.id,
          askerId: ask.askerId,
          doerId: ask.doerId ?? '',
          purpose: 'ask_escrow_release',
        },
      });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException('Failed to transfer payout to doer');
    }

    ask.stripeTransferId = transfer.id;
    ask.status = AskStatus.Payout;
    const saved = await this.asksRepo.save(ask);

    return {
      askId: saved.id,
      status: saved.status,
    };
  }

  private async resolveAskieFee(ask: Ask): Promise<number> {
    if (!ask.doerId) {
      return Number(ask.amount);
    }

    const offer = await this.offersRepo.findOne({
      where: { askId: ask.id, doerId: ask.doerId },
    });

    if (offer?.amount != null) {
      return Number(offer.amount);
    }

    return Number(ask.amount);
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

  private async findHoldableAsk(authUserId: string, askId: string): Promise<Ask> {
    const ask = await this.findAskerOwnedAsk(authUserId, askId);

    if (ask.paymentHeld) {
      throw new BadRequestException('Payment is already held for this ask');
    }

    if (!HOLDABLE_STATUSES.includes(ask.status)) {
      throw new BadRequestException(
        'Ask must be assigned (waiting or later) before collecting payment',
      );
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
