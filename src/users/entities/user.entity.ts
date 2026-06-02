import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ name: 'first_name', type: 'text' })
  firstName: string;

  @Column({ name: 'last_name', type: 'text' })
  lastName: string;

  @Column({ type: 'date' })
  dob: string;

  @Column({ name: 'phone_no', type: 'text' })
  phoneNo: string;

  @Column({ name: 'country_code', type: 'text' })
  countryCode: string;

  @Column({ type: 'text' })
  country: string;

  @Column({ type: 'text' })
  city: string;

  @Column({ type: 'text' })
  area: string;

  @Column({ name: 'profile_photo_path', type: 'text', nullable: true })
  profilePhotoPath: string | null;

  @Column({
    name: 'average_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
  })
  averageRating: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
