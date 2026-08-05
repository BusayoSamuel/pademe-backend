import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Ask } from '../asks/entities/ask.entity';
import { CreateLikeDto } from './dto/create-like.dto';
import { LikeResponseDto, UnlikeResponseDto } from './dto/like-response.dto';
import { AskLike } from './entities/ask-like.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(AskLike)
    private readonly likesRepo: Repository<AskLike>,
    @InjectRepository(Ask)
    private readonly asksRepo: Repository<Ask>,
  ) {}

  async like(userId: string, dto: CreateLikeDto): Promise<LikeResponseDto> {
    const ask = await this.asksRepo.findOne({ where: { id: dto.askId } });
    if (!ask) {
      throw new NotFoundException('Ask not found');
    }

    const existing = await this.likesRepo.findOne({
      where: { askId: dto.askId, userId },
    });
    if (existing) {
      throw new ConflictException('You already liked this ask');
    }

    const saved = await this.likesRepo.manager.transaction(async (manager) => {
      const like = manager.create(AskLike, {
        askId: dto.askId,
        userId,
      });
      const created = await manager.save(like);
      const likeCount = await manager.count(AskLike, {
        where: { askId: dto.askId },
      });
      await manager.update(Ask, { id: dto.askId }, { likeCount });
      return { created, likeCount };
    });

    return {
      id: saved.created.id,
      askId: saved.created.askId,
      userId: saved.created.userId,
      likeCount: saved.likeCount,
      createdAt: saved.created.createdAt,
    };
  }

  async unlike(userId: string, askId: string): Promise<UnlikeResponseDto> {
    const ask = await this.asksRepo.findOne({ where: { id: askId } });
    if (!ask) {
      throw new NotFoundException('Ask not found');
    }

    const existing = await this.likesRepo.findOne({
      where: { askId, userId },
    });
    if (!existing) {
      throw new NotFoundException('Like not found');
    }

    const likeCount = await this.likesRepo.manager.transaction(async (manager) => {
      await manager.remove(existing);
      const count = await manager.count(AskLike, { where: { askId } });
      await manager.update(Ask, { id: askId }, { likeCount: count });
      return count;
    });

    return {
      askId,
      likeCount,
      deleted: true,
    };
  }

  async getLikedAskIds(
    userId: string,
    askIds: string[],
  ): Promise<Set<string>> {
    if (askIds.length === 0) {
      return new Set();
    }

    const likes = await this.likesRepo.find({
      where: { userId, askId: In(askIds) },
      select: ['askId'],
    });

    return new Set(likes.map((like) => like.askId));
  }
}
