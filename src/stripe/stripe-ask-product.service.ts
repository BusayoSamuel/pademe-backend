import {
  Injectable,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { Ask } from '../asks/entities/ask.entity';
import { STRIPE_CLIENT } from './stripe.constants';
import { toStripeUnitAmount } from './stripe-amount.util';
import type { StripeClient } from './stripe.types';

export type AskStripeProductRefs = {
  productId: string;
  priceId: string;
};

@Injectable()
export class StripeAskProductService {
  constructor(
    @Inject(STRIPE_CLIENT)
    private readonly stripe: StripeClient,
  ) {}

  async createForAsk(ask: Ask): Promise<AskStripeProductRefs> {
    const product = await this.stripe.products.create({
      name: ask.title,
      description: this.truncateDescription(ask.description),
      metadata: this.askMetadata(ask),
    });

    try {
      const price = await this.createOneOffPrice(product.id, ask);
      return {
        productId: product.id,
        priceId: price.id,
      };
    } catch (error) {
      await this.stripe.products.update(product.id, { active: false });
      throw error;
    }
  }

  async syncForAsk(
    ask: Ask,
    previous?: Pick<Ask, 'amount' | 'currency' | 'stripePriceId'>,
  ): Promise<AskStripeProductRefs> {
    if (!ask.stripeProductId) {
      return this.createForAsk(ask);
    }

    await this.stripe.products.update(ask.stripeProductId, {
      name: ask.title,
      description: this.truncateDescription(ask.description),
      metadata: this.askMetadata(ask),
    });

    const pricingChanged =
      previous !== undefined &&
      (previous.amount !== ask.amount ||
        previous.currency.toUpperCase() !== ask.currency.toUpperCase());

    if (!pricingChanged && ask.stripePriceId) {
      return {
        productId: ask.stripeProductId,
        priceId: ask.stripePriceId,
      };
    }

    if (ask.stripePriceId) {
      await this.stripe.prices.update(ask.stripePriceId, { active: false });
    }

    const price = await this.createOneOffPrice(ask.stripeProductId, ask);

    return {
      productId: ask.stripeProductId,
      priceId: price.id,
    };
  }

  async archiveForAsk(ask: Ask): Promise<void> {
    if (!ask.stripeProductId) {
      return;
    }

    if (ask.stripePriceId) {
      await this.stripe.prices.update(ask.stripePriceId, { active: false });
    }

    await this.stripe.products.update(ask.stripeProductId, { active: false });
  }

  private async createOneOffPrice(productId: string, ask: Ask) {
    try {
      return await this.stripe.prices.create({
        product: productId,
        unit_amount: toStripeUnitAmount(ask.amount, ask.currency),
        currency: ask.currency.toLowerCase(),
        metadata: this.askMetadata(ask),
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to create Stripe one-off price for ask',
      );
    }
  }

  private askMetadata(ask: Ask): Record<string, string> {
    return {
      askId: ask.id,
      askerId: ask.askerId,
    };
  }

  private truncateDescription(description: string): string {
    return description.length > 500
      ? `${description.slice(0, 497)}...`
      : description;
  }
}
