import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ask } from '../../asks/entities/ask.entity';
import { User } from '../../users/entities/user.entity';
import { Message } from './message.entity';

@Entity({ name: 'conversations' })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ask_id', type: 'uuid', unique: true })
  askId: string;

  @Column({ name: 'asker_id', type: 'uuid' })
  askerId: string;

  @Column({ name: 'doer_id', type: 'uuid' })
  doerId: string;

  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt: Date | null;

  @ManyToOne(() => Ask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ask_id' })
  ask: Ask;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asker_id' })
  asker: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doer_id' })
  doer: User;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
