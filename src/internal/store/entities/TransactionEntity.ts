import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { TransactionStatus } from '../../../services/payment/paymentRepository';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'decimal',
    precision: 10,
  })
  amount!: number; // stored in naira or smallest unit

  @Column({ length: 3, default: 'NGN' })
  currency!: string;

  @Column()
  email!: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.INITIATED,
  })
  status!: string;

  @Column({
    nullable: true,
    name: 'paystack_reference',
  })
  reference!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @CreateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
};
