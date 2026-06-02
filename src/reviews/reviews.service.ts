import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageService } from '../storage/storage.service';
import { SupabaseService } from '../supabase/supabase.service';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { toReviewResponse } from './review.mapper';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepo: Repository<Review>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly storage: StorageService,
    private readonly supabase: SupabaseService,
  ) {}

  async create(
    authUserId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    if (dto.reviewerId !== authUserId) {
      throw new ForbiddenException('reviewerId must match authenticated user');
    }

    if (dto.revieweeId === dto.reviewerId) {
      throw new BadRequestException('Cannot review yourself');
    }

    const reviewee = await this.usersRepo.findOne({
      where: { id: dto.revieweeId },
    });
    if (!reviewee) {
      throw new NotFoundException('Reviewee not found');
    }

    const reviewer = await this.usersRepo.findOne({
      where: { id: dto.reviewerId },
    });
    if (!reviewer) {
      throw new NotFoundException(
        'Reviewer profile not found. Create user profile first.',
      );
    }

    const existing = await this.reviewsRepo.findOne({
      where: {
        reviewerId: dto.reviewerId,
        revieweeId: dto.revieweeId,
        type: dto.type,
      },
    });
    if (existing) {
      throw new ConflictException(
        'You already submitted a review of this type for this user',
      );
    }

    const review = this.reviewsRepo.create({
      rating: dto.rating.toFixed(1),
      notes: dto.notes,
      photoPath: dto.photoPath ?? null,
      type: dto.type,
      revieweeId: dto.revieweeId,
      reviewerId: dto.reviewerId,
    });

    const saved = await this.reviewsRepo.save(review);
    await this.recalculateAverageRating(dto.revieweeId);
    return this.mapReview(saved);
  }

  async findById(id: string): Promise<ReviewResponseDto> {
    const review = await this.reviewsRepo.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return this.mapReview(review);
  }

  async findByRevieweeId(revieweeId: string): Promise<ReviewResponseDto[]> {
    const user = await this.usersRepo.findOne({ where: { id: revieweeId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const reviews = await this.reviewsRepo.find({
      where: { revieweeId },
      order: { createdAt: 'DESC' },
    });

    return reviews.map((r) => this.mapReview(r));
  }

  async update(
    authUserId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsRepo.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewerId !== authUserId) {
      throw new ForbiddenException('Only the reviewer can update this review');
    }

    if (dto.rating !== undefined) {
      review.rating = dto.rating.toFixed(1);
    }
    if (dto.notes !== undefined) {
      review.notes = dto.notes;
    }
    if (dto.photoPath !== undefined) {
      review.photoPath = dto.photoPath;
    }

    const saved = await this.reviewsRepo.save(review);
    await this.recalculateAverageRating(review.revieweeId);
    return this.mapReview(saved);
  }

  async uploadPhoto(
    authUserId: string,
    reviewId: string,
    file: Express.Multer.File,
  ): Promise<ReviewResponseDto> {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const review = await this.reviewsRepo.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewerId !== authUserId) {
      throw new ForbiddenException('Only the reviewer can upload a photo');
    }

    const bucket = this.supabase.defaultBucket;
    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const path = `reviews/${reviewId}/${Date.now()}.${ext}`;

    await this.storage.upload(bucket, path, file.buffer, file.mimetype, {
      upsert: true,
    });

    review.photoPath = path;
    const saved = await this.reviewsRepo.save(review);
    return this.mapReview(saved);
  }

  private async recalculateAverageRating(revieweeId: string): Promise<void> {
    const result = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.reviewee_id = :revieweeId', { revieweeId })
      .getRawOne<{ avg: string | null }>();

    const avg = result?.avg;
    const user = await this.usersRepo.findOne({ where: { id: revieweeId } });
    if (!user) {
      return;
    }

    user.averageRating =
      avg === null || avg === undefined ? null : Number(avg).toFixed(2);
    await this.usersRepo.save(user);
  }

  private mapReview(review: Review): ReviewResponseDto {
    return toReviewResponse(review, this.storage, this.supabase.defaultBucket);
  }
}
