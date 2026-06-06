import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StripeKycStatus {
  None = 'none',
  Pending = 'pending',
  Verified = 'verified',
  Failed = 'failed',
}

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

  @Column({ name: 'stripe_connect_account_id', type: 'text', nullable: true })
  stripeConnectAccountId: string | null;

  @Column({
    name: 'stripe_kyc_status',
    type: 'text',
    default: StripeKycStatus.None,
  })
  stripeKycStatus: StripeKycStatus;

  @Column({ name: 'stripe_payouts_enabled', type: 'boolean', default: false })
  stripePayoutsEnabled: boolean;

  @Column({ name: 'stripe_charges_enabled', type: 'boolean', default: false })
  stripeChargesEnabled: boolean;

  @Column({
    name: 'stripe_onboarding_completed_at',
    type: 'timestamptz',
    nullable: true,
  })
  stripeOnboardingCompletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
