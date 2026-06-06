import Stripe from 'stripe';

export type StripeClient = InstanceType<typeof Stripe>;
export type StripeAccount = Awaited<
  ReturnType<StripeClient['accounts']['retrieve']>
>;
export type StripeEvent = ReturnType<
  StripeClient['webhooks']['constructEvent']
>;
export type StripeAccountCreateParams = NonNullable<
  Parameters<StripeClient['accounts']['create']>[0]
>;
export type StripeIndividualDob = {
  day: number;
  month: number;
  year: number;
};

export type StripeAccountSnapshot = Pick<
  StripeAccount,
  | 'id'
  | 'details_submitted'
  | 'payouts_enabled'
  | 'charges_enabled'
  | 'requirements'
  | 'metadata'
>;
