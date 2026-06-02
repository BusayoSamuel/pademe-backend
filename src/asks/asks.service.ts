import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
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
}
