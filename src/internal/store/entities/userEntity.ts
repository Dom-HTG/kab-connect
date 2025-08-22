import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Session } from './sessionEntity';
import { Transaction } from './TransactionEntity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  telegramId!: number;

  @OneToMany(() => Session, (session) => session.user)
  sessions?: Session[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions?: Transaction[];
}
