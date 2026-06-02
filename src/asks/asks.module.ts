import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Ask } from './entities/ask.entity';
import { AsksController } from './asks.controller';
import { AsksService } from './asks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ask, User])],
  controllers: [AsksController],
  providers: [AsksService],
  exports: [AsksService],
})
export class AsksModule {}
