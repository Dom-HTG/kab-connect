import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './userEntity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.sessions)
  user!: User;

  @Column()
  status!: 'active' | 'completed'; // live vs ended session

  @CreateDateColumn()
  startTime?: Date;

  @UpdateDateColumn()
  endTime?: Date;
}
