import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string; // Store user email directly

  @Column()
  telegramId!: number; // Store Telegram user ID directly

  @Column()
  status!: 'active' | 'completed'; // live vs ended session

  @CreateDateColumn()
  startTime?: Date;

  @UpdateDateColumn()
  endTime?: Date;
}
