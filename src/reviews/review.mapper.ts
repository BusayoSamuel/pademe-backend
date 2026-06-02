import { StorageService } from '../storage/storage.service';
import { ReviewResponseDto } from './dto/review-response.dto';
import { Review } from './entities/review.entity';

export function toReviewResponse(
  review: Review,
  storage: StorageService,
  bucket: string,
): ReviewResponseDto {
  const photoUrl = review.photoPath
    ? storage.getPublicUrl(bucket, review.photoPath)
    : null;

  return {
    id: review.id,
    rating: Number(review.rating),
    notes: review.notes,
    photoPath: review.photoPath,
    photoUrl,
    type: review.type,
    revieweeId: review.revieweeId,
    reviewerId: review.reviewerId,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}
