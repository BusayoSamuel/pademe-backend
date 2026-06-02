import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ask, AskStatus } from '../asks/entities/ask.entity';
import { User } from '../users/entities/user.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferResponseDto } from './dto/offer-response.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { toOfferResponse } from './offer.mapper';
import { Offer } from './entities/offer.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offersRepo: Repository<Offer>,
    @InjectRepository(Ask)
    private readonly asksRepo: Repository<Ask>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(
    authUserId: string,
    dto: CreateOfferDto,
  ): Promise<OfferResponseDto> {
    if (dto.doerId !== authUserId) {
      throw new ForbiddenException('doerId must match authenticated user');
    }

    const ask = await this.asksRepo.findOne({ where: { id: dto.askId } });
    if (!ask) {
      throw new NotFoundException('Ask not found');
    }

    if (ask.askerId === dto.doerId) {
      throw new ForbiddenException(
        'Asker cannot submit an offer on their own ask',
      );
    }

    const doer = await this.usersRepo.findOne({ where: { id: dto.doerId } });
    if (!doer) {
      throw new NotFoundException(
        'Doer profile not found. Create user profile first.',
      );
    }

    const existing = await this.offersRepo.findOne({
      where: { askId: dto.askId, doerId: dto.doerId },
    });
    if (existing) {
      throw new ConflictException(
        'You already submitted an offer for this ask',
      );
    }

    const offer = this.offersRepo.create({
      askId: dto.askId,
      doerId: dto.doerId,
      note: dto.note,
    });

    const saved = await this.offersRepo.save(offer);
    return toOfferResponse(saved);
  }

  async findById(id: string): Promise<OfferResponseDto> {
    const offer = await this.offersRepo.findOne({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return toOfferResponse(offer);
  }

  async findByAskId(askId: string): Promise<OfferResponseDto[]> {
    const ask = await this.asksRepo.findOne({ where: { id: askId } });
    if (!ask) {
      throw new NotFoundException('Ask not found');
    }

    const offers = await this.offersRepo.find({
      where: { askId },
      order: { createdAt: 'DESC' },
    });

    return offers.map(toOfferResponse);
  }

  async updateNote(
    authUserId: string,
    offerId: string,
    dto: UpdateOfferDto,
  ): Promise<OfferResponseDto> {
    const offer = await this.offersRepo.findOne({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.doerId !== authUserId) {
      throw new ForbiddenException('Only the doer can update this offer');
    }

    offer.note = dto.note;
    const saved = await this.offersRepo.save(offer);
    return toOfferResponse(saved);
  }

  async remove(
    authUserId: string,
    offerId: string,
  ): Promise<{ deleted: string }> {
    const offer = await this.offersRepo.findOne({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.doerId !== authUserId) {
      throw new ForbiddenException('Only the doer can withdraw this offer');
    }

    const ask = await this.asksRepo.findOne({ where: { id: offer.askId } });
    if (!ask) {
      throw new NotFoundException('Ask not found');
    }

    if (ask.status !== AskStatus.Posted) {
      throw new ConflictException(
        'Offer can only be withdrawn while ask status is posted',
      );
    }

    await this.offersRepo.remove(offer);
    return { deleted: offerId };
  }
}
