import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { User } from '../users/entities/user.entity';
import { StripeAskProductService } from './stripe-ask-product.service';
import { STRIPE_CLIENT } from './stripe.constants';
import { StripeOnboardingRedirectController } from './stripe-onboarding-redirect.controller';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  controllers: [
    StripeController,
    StripeWebhookController,
    StripeOnboardingRedirectController,
  ],
  providers: [
    {
      provide: STRIPE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secretKey = config.get<string>('stripe.secretKey');
        if (!secretKey) {
          throw new Error('STRIPE_SECRET_KEY is required');
        }

        return new Stripe(secretKey);
      },
    },
    StripeService,
    StripeAskProductService,
  ],
  exports: [StripeService, StripeAskProductService],
})
export class StripeModule {}
