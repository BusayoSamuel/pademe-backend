import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AskUrgency {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum AskStatus {
  Posted = 'posted',
  Waiting = 'waiting',
  InConversation = 'in_conversation',
  MeetAndComplete = 'meet_complete',
  Payout = 'payout',
}

@Entity({ name: 'asks' })
export class Ask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  location: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ name: 'date_posted', type: 'timestamptz' })
  datePosted: Date;

  @Column({ type: 'text' })
  urgency: AskUrgency;

  @Column({ type: 'text', default: AskStatus.Posted })
  status: AskStatus;

  @Column({ name: 'asker_id', type: 'uuid' })
  askerId: string;

  @Column({ name: 'doer_id', type: 'uuid', nullable: true })
  doerId: string | null;

  @Column({ name: 'stripe_product_id', type: 'text', nullable: true })
  stripeProductId: string | null;

  @Column({ name: 'stripe_price_id', type: 'text', nullable: true })
  stripePriceId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asker_id' })
  asker: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doer_id' })
  doer: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
