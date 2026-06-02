import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ask } from '../../asks/entities/ask.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'offers' })
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ask_id', type: 'uuid' })
  askId: string;

  @Column({ name: 'doer_id', type: 'uuid' })
  doerId: string;

  @Column({ type: 'text' })
  note: string;

  @ManyToOne(() => Ask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ask_id' })
  ask: Ask;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doer_id' })
  doer: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
