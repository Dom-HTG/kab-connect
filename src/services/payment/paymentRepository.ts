import { DataSource, Repository } from "typeorm";
import { PostgresService } from "../../internal/store/database";
import { Transaction } from "../../internal/store/entities/TransactionEntity";
import { NotFoundErrror } from "../../internal/error";

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
};

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
    updateTransactionStatus(reference: string, status: ITransaction['status']): Promise<Transaction>;
    getTransactionByReference(reference: string): Promise<Transaction | null>;
    findById(id: string): Promise<Transaction | null>;
}

export class PaymentRepository implements IPaymentRepository {
    private paymentRepository: Repository<Transaction>;
    private dataSource: DataSource;

    constructor(postgresService: PostgresService, dataSource: DataSource){
        /* get repository from injected postgresService */
        this.paymentRepository = postgresService.getPaymentRepository();
        this.dataSource = dataSource;
    }

    /* create new payment intent */
    async createTransaction(data: Partial<ITransaction>): Promise<Transaction> {
        const paymentIntent = this.paymentRepository.create(data);
        const savedPayment = await this.paymentRepository.save(paymentIntent);
        return savedPayment;
    }

    /* updates transaction status after verification */
    async updateTransactionStatus(reference: string, status: ITransaction['status']): Promise<Transaction> {
        /*  Start database transaction */
        return await this.dataSource.transaction(async (transactionEntityManager) => {
            const paymentRepo = transactionEntityManager.getRepository(Transaction);
            const payment = await paymentRepo.findOne({
                where: { reference }
            });

            if (!payment) throw new NotFoundErrror('Transaction record not found..');

            /* update record */
            payment.status = status;

            /* save update */
            const updatedTransaction = await paymentRepo.save(payment);
            return updatedTransaction;
        });
    }

    /* retrieve a transaction by its reference */
    async getTransactionByReference(reference: string): Promise<Transaction | null> {
        const transaction = await this.paymentRepository.findOne({
            where: { reference },
        });
        return transaction;
    }

    /* retrieve transaction by id */
    async findById(id: string): Promise<Transaction | null> {
        const transaction = await this.paymentRepository.findOne({
            where: { id },
        });
        return transaction;
    }
}