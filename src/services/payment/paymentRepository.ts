import { DataSource, Repository } from 'typeorm';
import pino from 'pino';
import { PostgresService } from '../../internal/store/database';
import { Transaction } from '../../internal/store/entities/TransactionEntity';
import { NotFoundErrror } from '../../internal/error';

// export type TransactionStatus = 'initiated' | 'pending' | 'success' | 'failed' | 'refunded';

export interface ITransaction {
  id: string;
  amount: number;
  currency: string;
  email: string;
  status: 'initiated' | 'pending' | 'success' | 'failed' | 'refunded';
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/* This contract defines all database level abstractions for the payment service */

export interface IPaymentRepository {
  createTransaction(data: Partial<ITransaction>): Promise<Transaction>;
  updateTransactionStatus(
    reference: string,
    status: ITransaction['status'],
  ): Promise<Transaction>;
  getTransactionByReference(reference: string): Promise<Transaction | null>;
  findById(id: string): Promise<Transaction | null>;
}

export class PaymentRepository implements IPaymentRepository {
  private logs: pino.Logger;
  private paymentRepository: Repository<Transaction>;
  private dataSource: DataSource;

  constructor(
    postgresService: PostgresService,
    dataSource: DataSource,
    logger: pino.Logger,
  ) {
    /* get repository from injected postgresService */
    this.paymentRepository = postgresService.getPaymentRepository();
    this.dataSource = dataSource;
    this.logs = logger;
  }

  /* create new payment intent */
  async createTransaction(data: Partial<ITransaction>): Promise<Transaction> {
    try {
      const newTransaction = this.paymentRepository.create(data);
      const savedTransaction =
        await this.paymentRepository.save(newTransaction);
      this.logs.info('Transaction record created successfully...');
      return savedTransaction;
    } catch (e) {
      this.logs.error(e, 'Error creating transaction record...');
      throw e;
    }
  }

  /* updates transaction status after verification */
  async updateTransactionStatus(
    reference: string,
    status: ITransaction['status'],
  ): Promise<Transaction> {
    try {
      /*  Start database transaction */
      return await this.dataSource.transaction(
        async (transactionEntityManager) => {
          const paymentRepo =
            transactionEntityManager.getRepository(Transaction);
          const payment = await paymentRepo.findOne({
            where: { reference },
          });

          if (!payment) {
            this.logs.error(
              'Transaction record not found...[CATCH_PAYMENT_REPOSITORY_LEVEL]',
            );
            throw new NotFoundErrror('Transaction record not found..');
          } else {
            this.logs.info('Transaction record found...');
          }

          /* update record */
          payment.status = status;

          /* save update */
          const updatedTransaction = await paymentRepo.save(payment);
          return updatedTransaction;
        },
      );
    } catch (e) {
      this.logs.error(e, 'Error updating transaction status...');
      throw e;
    }
  }

  /* retrieve a transaction by its reference */
  async getTransactionByReference(
    reference: string,
  ): Promise<Transaction | null> {
    try {
      const transaction = await this.paymentRepository.findOne({
        where: { reference },
      });
      this.logs.info('Transaction fetched by reference...');
      return transaction;
    } catch (e) {
      this.logs.error(e, 'Error fetching transaction by reference...');
      throw e;
    }
  }

  /* retrieve transaction by id */
  async findById(id: string): Promise<Transaction | null> {
    try {
      const transaction = await this.paymentRepository.findOne({
        where: { id },
      });
      return transaction;
    } catch (e) {
      this.logs.error(e, 'Error fetching transaction by id...');
      throw e;
    }
  }
}
