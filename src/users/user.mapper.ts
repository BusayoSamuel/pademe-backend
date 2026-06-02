import { StorageService } from '../storage/storage.service';
import { User } from './entities/user.entity';

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
  createdAt: Date;
  updatedAt: Date;
};

export function toUserResponse(
  user: User,
  storage: StorageService,
  bucket: string,
): UserResponse {
  const profilePhotoUrl = user.profilePhotoPath
    ? storage.getPublicUrl(bucket, user.profilePhotoPath)
    : null;

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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
