import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Ask } from '../../asks/entities/ask.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'ask_likes' })
@Unique('ask_likes_ask_user_unique', ['askId', 'userId'])
export class AskLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ask_id', type: 'uuid' })
  askId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Ask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ask_id' })
  ask: Ask;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
