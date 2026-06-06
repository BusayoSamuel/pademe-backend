import { StripeKycStatus } from '../users/entities/user.entity';
import type { StripeAccountSnapshot } from './stripe.types';

export type ConnectAccountSnapshot = {
  kycStatus: StripeKycStatus;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingCompletedAt: Date | null;
  requirementsCurrentlyDue: string[];
  disabledReason: string | null;
};

export function toConnectAccountSnapshot(
  account: StripeAccountSnapshot,
): ConnectAccountSnapshot {
  const disabledReason = account.requirements?.disabled_reason ?? null;
  const detailsSubmitted = account.details_submitted ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;
  const chargesEnabled = account.charges_enabled ?? false;
  const requirementsCurrentlyDue = account.requirements?.currently_due ?? [];

  let kycStatus = StripeKycStatus.Pending;

  if (disabledReason) {
    kycStatus = StripeKycStatus.Failed;
  } else if (payoutsEnabled && detailsSubmitted) {
    kycStatus = StripeKycStatus.Verified;
  } else if (!account.id) {
    kycStatus = StripeKycStatus.None;
  }

  const onboardingCompletedAt = detailsSubmitted ? new Date() : null;

  return {
    kycStatus,
    payoutsEnabled,
    chargesEnabled,
    detailsSubmitted,
    onboardingCompletedAt,
    requirementsCurrentlyDue,
    disabledReason,
  };
}

export function toUserStripeSummary(user: {
  stripeConnectAccountId: string | null;
  stripeKycStatus: StripeKycStatus;
  stripePayoutsEnabled: boolean;
  stripeChargesEnabled: boolean;
  stripeOnboardingCompletedAt: Date | null;
}) {
  return {
    connectAccountId: user.stripeConnectAccountId,
    kycStatus: user.stripeKycStatus,
    payoutsEnabled: user.stripePayoutsEnabled,
    chargesEnabled: user.stripeChargesEnabled,
    onboardingRequired:
      user.stripeKycStatus === StripeKycStatus.Failed ||
      user.stripeOnboardingCompletedAt === null,
  };
}
