import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../offers/entities/offer.entity';
import { User } from '../users/entities/user.entity';
import { ChooseOfferDto } from './dto/choose-offer.dto';
import { CreateAskDto } from './dto/create-ask.dto';
import { AskResponseDto } from './dto/ask-response.dto';
import { toAskResponse } from './ask.mapper';
import { Ask, AskStatus } from './entities/ask.entity';

@Injectable()
export class AsksService {
  constructor(
    @InjectRepository(Ask)
    private readonly asksRepo: Repository<Ask>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Offer)
    private readonly offersRepo: Repository<Offer>,
  ) {}

  async create(authUserId: string, dto: CreateAskDto): Promise<AskResponseDto> {
    if (dto.askerId !== authUserId) {
      throw new ForbiddenException('askerId must match authenticated user');
    }

    const asker = await this.usersRepo.findOne({ where: { id: dto.askerId } });
    if (!asker) {
      throw new NotFoundException(
        'Asker profile not found. Create user profile first.',
      );
    }

    const ask = this.asksRepo.create({
      title: dto.title,
      description: dto.description,
      location: dto.location,
      amount: dto.amount.toFixed(2),
      currency: dto.currency.toUpperCase(),
      dueDate: dto.dueDate,
      datePosted: new Date(),
      urgency: dto.urgency,
      status: AskStatus.Posted,
      askerId: dto.askerId,
      doerId: null,
    });

    const saved = await this.asksRepo.save(ask);
    return toAskResponse(saved);
  }

  async chooseOffer(
    authUserId: string,
    askId: string,
    dto: ChooseOfferDto,
  ): Promise<AskResponseDto> {
    const ask = await this.asksRepo.findOne({ where: { id: askId } });
    if (!ask) {
      throw new NotFoundException('Ask not found');
    }

    if (ask.askerId !== authUserId) {
      throw new ForbiddenException('Only the asker can choose an offer');
    }

    if (ask.status !== AskStatus.Posted) {
      throw new ConflictException(
        'Offer can only be chosen while ask status is posted',
      );
    }

    const offer = await this.offersRepo.findOne({
      where: { id: dto.offerId },
    });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.askId !== askId) {
      throw new BadRequestException('Offer does not belong to this ask');
    }

    ask.doerId = offer.doerId;
    ask.status = AskStatus.Waiting;

    const saved = await this.asksRepo.save(ask);
    return toAskResponse(saved);
  }

  async remove(authUserId: string, askId: string): Promise<{ deleted: string }> {
    const ask = await this.asksRepo.findOne({ where: { id: askId } });
    if (!ask) {
      throw new NotFoundException('Ask not found');
    }

    if (ask.askerId !== authUserId) {
      throw new ForbiddenException('Only the asker can delete this ask');
    }

    await this.asksRepo.remove(ask);
    return { deleted: askId };
  }
}
