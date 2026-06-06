import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsModule } from '../conversations/conversations.module';
import { Offer } from '../offers/entities/offer.entity';
import { StripeModule } from '../stripe/stripe.module';
import { User } from '../users/entities/user.entity';
import { Ask } from './entities/ask.entity';
import { AsksController } from './asks.controller';
import { AsksService } from './asks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ask, User, Offer]),
    ConversationsModule,
    StripeModule,
  ],
  controllers: [AsksController],
  providers: [AsksService],
  exports: [AsksService],
})
export class AsksModule {}
