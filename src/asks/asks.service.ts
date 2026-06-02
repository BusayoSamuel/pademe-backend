import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ConversationsService } from '../conversations/conversations.service';
import { Offer } from '../offers/entities/offer.entity';
import { User } from '../users/entities/user.entity';
import { ChooseOfferDto } from './dto/choose-offer.dto';
import { CreateAskDto } from './dto/create-ask.dto';
import { ListAsksQueryDto } from './dto/list-asks-query.dto';
import { UpdateAskDto } from './dto/update-ask.dto';
import { UpdateAskStatusDto } from './dto/update-ask-status.dto';
import { AskResponseDto } from './dto/ask-response.dto';
import { toAskResponse } from './ask.mapper';
import { Ask, AskStatus } from './entities/ask.entity';

const STATUS_ORDER: AskStatus[] = [
  AskStatus.Posted,
  AskStatus.Waiting,
  AskStatus.InConversation,
  AskStatus.MeetAndComplete,
  AskStatus.Payout,
];

@Injectable()
export class AsksService {
  constructor(
    @InjectRepository(Ask)
    private readonly asksRepo: Repository<Ask>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Offer)
    private readonly offersRepo: Repository<Offer>,
    private readonly conversationsService: ConversationsService,
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

  async findAll(query: ListAsksQueryDto): Promise<AskResponseDto[]> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: FindOptionsWhere<Ask> = {};
    if (query.status) {
      where.status = query.status;
    }

    const asks = await this.asksRepo.find({
      where,
      order: { datePosted: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return asks.map(toAskResponse);
  }

  async findOne(askId: string): Promise<AskResponseDto> {
    const ask = await this.asksRepo.findOne({ where: { id: askId } });
    if (!ask) {
      throw new NotFoundException('Ask not found');
    }
    return toAskResponse(ask);
  }

  async findMyAsks(authUserId: string): Promise<AskResponseDto[]> {
    const asks = await this.asksRepo.find({
      where: { askerId: authUserId },
      order: { datePosted: 'DESC' },
    });
    return asks.map(toAskResponse);
  }

  async findMyJobs(authUserId: string): Promise<AskResponseDto[]> {
    const asks = await this.asksRepo.find({
      where: { doerId: authUserId },
      order: { updatedAt: 'DESC' },
    });
    return asks.map(toAskResponse);
  }

  async update(
    authUserId: string,
    askId: string,
    dto: UpdateAskDto,
  ): Promise<AskResponseDto> {
    const ask = await this.asksRepo.findOne({ where: { id: askId } });
    if (!ask) {
      throw new NotFoundException('Ask not found');
    }

    if (ask.askerId !== authUserId) {
      throw new ForbiddenException('Only the asker can update this ask');
    }

    if (ask.status !== AskStatus.Posted) {
      throw new ConflictException(
        'Ask can only be edited while status is posted',
      );
    }

    if (dto.title !== undefined) ask.title = dto.title;
    if (dto.description !== undefined) ask.description = dto.description;
    if (dto.location !== undefined) ask.location = dto.location;
    if (dto.amount !== undefined) ask.amount = dto.amount.toFixed(2);
    if (dto.currency !== undefined) ask.currency = dto.currency.toUpperCase();
    if (dto.dueDate !== undefined) ask.dueDate = dto.dueDate;
    if (dto.urgency !== undefined) ask.urgency = dto.urgency;

    const saved = await this.asksRepo.save(ask);
    return toAskResponse(saved);
  }

  async updateStatus(
    authUserId: string,
    askId: string,
    dto: UpdateAskStatusDto,
  ): Promise<AskResponseDto> {
    const ask = await this.asksRepo.findOne({ where: { id: askId } });
    if (!ask) {
      throw new NotFoundException('Ask not found');
    }

    this.assertCanUpdateStatus(ask, authUserId, dto.status);

    ask.status = dto.status;
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
    await this.conversationsService.createForAsk(saved);
    return toAskResponse(saved);
  }

  async remove(
    authUserId: string,
    askId: string,
  ): Promise<{ deleted: string }> {
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

  async countCompletedByDoer(
    doerId: string,
  ): Promise<{ doerId: string; completedCount: number }> {
    const doer = await this.usersRepo.findOne({ where: { id: doerId } });
    if (!doer) {
      throw new NotFoundException('Doer not found');
    }

    const completedCount = await this.asksRepo.count({
      where: { doerId, status: AskStatus.Payout },
    });

    return { doerId, completedCount };
  }

  private assertCanUpdateStatus(
    ask: Ask,
    authUserId: string,
    nextStatus: AskStatus,
  ): void {
    const isAsker = ask.askerId === authUserId;
    const isDoer = ask.doerId === authUserId;

    if (!isAsker && !isDoer) {
      throw new ForbiddenException('Only the asker or doer can update status');
    }

    if (nextStatus === AskStatus.Posted) {
      throw new BadRequestException('Cannot revert to posted status');
    }

    if (nextStatus === AskStatus.Waiting) {
      throw new BadRequestException(
        'Use choose-offer to move to waiting status',
      );
    }

    const currentIdx = STATUS_ORDER.indexOf(ask.status);
    const nextIdx = STATUS_ORDER.indexOf(nextStatus);

    if (nextIdx <= currentIdx) {
      throw new BadRequestException(
        `Invalid transition from ${ask.status} to ${nextStatus}`,
      );
    }

    if (nextIdx !== currentIdx + 1) {
      throw new BadRequestException(
        `Status must advance one step at a time (current: ${ask.status})`,
      );
    }

    if (!ask.doerId) {
      throw new BadRequestException('Ask has no assigned doer yet');
    }

    if (nextStatus === AskStatus.Payout && !isAsker) {
      throw new ForbiddenException('Only the asker can mark ask as payout');
    }
  }
}
