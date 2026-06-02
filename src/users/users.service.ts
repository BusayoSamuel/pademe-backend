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
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { toUserResponse, UserResponse } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly supabase: SupabaseService,
    private readonly storage: StorageService,
  ) {}

  async createProfile(
    authUserId: string,
    authEmail: string | undefined,
    dto: CreateUserProfileDto,
  ): Promise<UserResponse> {
    if (dto.id !== authUserId) {
      throw new ForbiddenException('Profile id must match authenticated user');
    }

    if (authEmail && dto.email.toLowerCase() !== authEmail.toLowerCase()) {
      throw new ForbiddenException(
        'Profile email must match authenticated user',
      );
    }

    const existing = await this.usersRepo.findOne({
      where: [{ id: dto.id }, { email: dto.email.toLowerCase() }],
    });
    if (existing) {
      throw new ConflictException('User profile already exists');
    }

    const user = this.usersRepo.create({
      id: dto.id,
      email: dto.email.toLowerCase(),
      firstName: dto.firstName,
      lastName: dto.lastName,
      dob: dto.dob,
      phoneNo: dto.phoneNo,
      countryCode: dto.countryCode,
      country: dto.country,
      city: dto.city,
      area: dto.area,
      profilePhotoPath: null,
      averageRating: null,
    });

    const saved = await this.usersRepo.save(user);
    return this.mapUser(saved);
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    const user = await this.findByIdOrFail(id);

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.dob !== undefined) user.dob = dto.dob;
    if (dto.phoneNo !== undefined) user.phoneNo = dto.phoneNo;
    if (dto.countryCode !== undefined) user.countryCode = dto.countryCode;
    if (dto.country !== undefined) user.country = dto.country;
    if (dto.city !== undefined) user.city = dto.city;
    if (dto.area !== undefined) user.area = dto.area;
    if (dto.profilePhotoPath !== undefined) {
      user.profilePhotoPath = dto.profilePhotoPath;
    }

    const saved = await this.usersRepo.save(user);
    return this.mapUser(saved);
  }

  async uploadProfilePhoto(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserResponse> {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const user = await this.findByIdOrFail(userId);
    const bucket = this.supabase.defaultBucket;
    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const path = `profiles/${userId}/avatar.${ext}`;

    await this.storage.upload(bucket, path, file.buffer, file.mimetype, {
      upsert: true,
    });

    user.profilePhotoPath = path;
    const saved = await this.usersRepo.save(user);
    return this.mapUser(saved);
  }

  getMe(id: string): Promise<UserResponse> {
    return this.findByIdOrFail(id).then((user) => this.mapUser(user));
  }

  private mapUser(user: User): UserResponse {
    return toUserResponse(user, this.storage, this.supabase.defaultBucket);
  }
}
