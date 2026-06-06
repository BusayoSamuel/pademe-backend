import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeKycStatus, User } from '../users/entities/user.entity';
import { toIsoCountryCode } from '../common/country-iso.util';
import { STRIPE_CLIENT } from './stripe.constants';
import type {
  StripeAccountSnapshot,
  StripeClient,
  StripeEvent,
  StripeIndividualDob,
} from './stripe.types';
import {
  ConnectAccountSnapshot,
  toConnectAccountSnapshot,
  toUserStripeSummary,
} from './stripe-connect.mapper';
import { ConnectStatusResponseDto } from './dto/connect-status-response.dto';
import { OnboardingLinkResponseDto } from './dto/onboarding-link-response.dto';

@Injectable()
export class StripeService {
  constructor(
    @Inject(STRIPE_CLIENT)
    private readonly stripe: StripeClient,
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async createOnboardingLink(userId: string): Promise<OnboardingLinkResponseDto> {
    const user = await this.findUserOrFail(userId);
    const accountId = await this.ensureConnectAccount(user);
    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: this.getConnectRefreshUrl(),
      return_url: this.getConnectReturnUrl(),
      type: 'account_onboarding',
    });

    if (!link.url) {
      throw new InternalServerErrorException('Stripe did not return onboarding URL');
    }

    return {
      url: link.url,
      expiresAt: link.expires_at,
    };
  }

  async refreshConnectStatus(userId: string): Promise<ConnectStatusResponseDto> {
    const user = await this.findUserOrFail(userId);

    if (!user.stripeConnectAccountId) {
      return this.toStatusResponse(user, {
        kycStatus: StripeKycStatus.None,
        payoutsEnabled: false,
        chargesEnabled: false,
        detailsSubmitted: false,
        onboardingCompletedAt: null,
        requirementsCurrentlyDue: [],
        disabledReason: null,
      });
    }

    const account = await this.stripe.accounts.retrieve(user.stripeConnectAccountId);
    const snapshot = toConnectAccountSnapshot(account);
    const updated = await this.applyConnectSnapshot(user, snapshot);
    return this.toStatusResponse(updated, snapshot);
  }

  async handleAccountUpdated(account: StripeAccountSnapshot): Promise<void> {
    const userId = account.metadata?.userId;
    if (!userId) {
      return;
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      return;
    }

    const snapshot = toConnectAccountSnapshot(account);
    await this.applyConnectSnapshot(user, snapshot, account.id);
  }

  constructWebhookEvent(payload: Buffer, signature: string): StripeEvent {
    const webhookSecret = this.config.get<string>('stripe.webhookSecret');
    if (!webhookSecret || webhookSecret === 'whsec_...') {
      throw new BadRequestException('Stripe webhook secret is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }
  }

  private async ensureConnectAccount(user: User): Promise<string> {
    if (user.stripeConnectAccountId) {
      return user.stripeConnectAccountId;
    }

    const account = await this.stripe.accounts.create({
      type: 'express',
      country: this.toStripeCountry(user.country),
      email: user.email,
      business_type: 'individual',
      individual: {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        dob: this.parseDob(user.dob),
        phone: this.formatPhone(user.countryCode, user.phoneNo),
      },
      metadata: {
        userId: user.id,
      },
      capabilities: {
        transfers: { requested: true },
      },
    });

    user.stripeConnectAccountId = account.id;
    user.stripeKycStatus = StripeKycStatus.Pending;
    user.stripePayoutsEnabled = false;
    user.stripeChargesEnabled = false;
    await this.usersRepo.save(user);

    return account.id;
  }

  private async applyConnectSnapshot(
    user: User,
    snapshot: ConnectAccountSnapshot,
    connectAccountId?: string,
  ): Promise<User> {
    if (connectAccountId) {
      user.stripeConnectAccountId = connectAccountId;
    }

    user.stripeKycStatus = snapshot.kycStatus;
    user.stripePayoutsEnabled = snapshot.payoutsEnabled;
    user.stripeChargesEnabled = snapshot.chargesEnabled;

    if (snapshot.onboardingCompletedAt && !user.stripeOnboardingCompletedAt) {
      user.stripeOnboardingCompletedAt = snapshot.onboardingCompletedAt;
    }

    return this.usersRepo.save(user);
  }

  private async findUserOrFail(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException(
        'User profile not found. Create user profile first.',
      );
    }
    return user;
  }

  private toStatusResponse(
    user: User,
    snapshot: ConnectAccountSnapshot,
  ): ConnectStatusResponseDto {
    const stripeSummary = toUserStripeSummary(user);

    return {
      connectAccountId: user.stripeConnectAccountId,
      kycStatus: snapshot.kycStatus,
      payoutsEnabled: snapshot.payoutsEnabled,
      chargesEnabled: snapshot.chargesEnabled,
      detailsSubmitted: snapshot.detailsSubmitted,
      onboardingRequired: stripeSummary.onboardingRequired,
      requirementsCurrentlyDue: snapshot.requirementsCurrentlyDue,
      disabledReason: snapshot.disabledReason,
    };
  }

  private getConnectReturnUrl(): string {
    const url = this.config.get<string>('stripe.connectReturnUrl');
    if (!url) {
      throw new InternalServerErrorException(
        'STRIPE_CONNECT_RETURN_URL is not configured',
      );
    }
    return url;
  }

  private getConnectRefreshUrl(): string {
    const url = this.config.get<string>('stripe.connectRefreshUrl');
    if (!url) {
      throw new InternalServerErrorException(
        'STRIPE_CONNECT_REFRESH_URL is not configured',
      );
    }
    return url;
  }

  private toStripeCountry(country: string): string {
    return toIsoCountryCode(country);
  }

  private parseDob(dob: string): StripeIndividualDob {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
    if (!match) {
      throw new BadRequestException('dob must be in YYYY-MM-DD format');
    }

    return {
      year: Number.parseInt(match[1], 10),
      month: Number.parseInt(match[2], 10),
      day: Number.parseInt(match[3], 10),
    };
  }

  private formatPhone(countryCode: string, phoneNo: string): string {
    const normalizedCode = countryCode.startsWith('+')
      ? countryCode
      : `+${countryCode}`;
    const digits = phoneNo.replace(/\D/g, '');
    return `${normalizedCode}${digits}`;
  }
}
