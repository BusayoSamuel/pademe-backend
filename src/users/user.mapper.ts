import { StorageService } from '../storage/storage.service';
import { toUserStripeSummary } from '../stripe/stripe-connect.mapper';
import { UserStripeDto } from './dto/user-stripe.dto';
import { User } from './entities/user.entity';

/** Signed URL lifetime for profile photos returned to clients. */
const PROFILE_PHOTO_SIGNED_URL_SECONDS = 60 * 60 * 24; // 24 hours

export type UserResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dob: string;
  phoneNo: string;
  countryCode: string;
  country: string;
  city: string;
  area: string;
  profilePhotoPath: string | null;
  profilePhotoUrl: string | null;
  averageRating: number | null;
  stripe: UserStripeDto;
  createdAt: Date;
  updatedAt: Date;
};

export async function toUserResponse(
  user: User,
  storage: StorageService,
  bucket: string,
): Promise<UserResponse> {
  let profilePhotoUrl: string | null = null;

  if (user.profilePhotoPath) {
    try {
      // Bucket is private — public URLs 404; clients need signed URLs.
      profilePhotoUrl = await storage.createSignedUrl(
        bucket,
        user.profilePhotoPath,
        PROFILE_PHOTO_SIGNED_URL_SECONDS,
      );
    } catch {
      profilePhotoUrl = null;
    }
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    dob: user.dob,
    phoneNo: user.phoneNo,
    countryCode: user.countryCode,
    country: user.country,
    city: user.city,
    area: user.area,
    profilePhotoPath: user.profilePhotoPath,
    profilePhotoUrl,
    averageRating:
      user.averageRating === null ? null : Number(user.averageRating),
    stripe: toUserStripeSummary(user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
