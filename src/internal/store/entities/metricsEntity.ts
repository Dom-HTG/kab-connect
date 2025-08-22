import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Period } from '../../../types/metrics.types';

@Entity('metrics')
export class Metrics {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Number of users currently connected (if snapshot-based)
  @Column({ type: 'int', default: 0 })
  activeCount?: number;

  // Aggregate statistics
  @Column({ type: 'int', default: 0 })
  totalSessions?: number;

  @Column({ type: 'int', default: 0 })
  totalUsers?: number;

  @Column({ type: 'int', default: 0 })
  totalTransactions?: number;

  // Store monetary values in kobo (smallest currency unit) to avoid float issues
  @Column({ type: 'bigint', default: 0 })
  totalPayments?: number;

  // Time window for the aggregation
  @Column({ type: 'varchar' })
  period?: Period;

  // Range of dates this metric applies to
  @Column({ type: 'timestamptz' })
  startDate?: Date;

  @Column({ type: 'timestamptz' })
  endDate?: Date;

  // Auto timestamps
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt?: Date;
}
