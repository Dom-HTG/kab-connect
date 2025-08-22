import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './userEntity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.transactions)
  user!: User;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number; // stored in naira or smallest unit

  @Column()
  status!: 'success' | 'failed' | 'pending';

  @Column()
  reference!: string; // paystack/stripe reference

  @CreateDateColumn()
  createdAt?: Date;
}
