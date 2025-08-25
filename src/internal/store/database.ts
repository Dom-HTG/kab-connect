import { DataSource, Repository } from 'typeorm';
import { Configs } from '../../config/config';
import { Transaction } from './entities/TransactionEntity';
import { Session } from './entities/sessionEntity';

export class PostgresService {
  private dataSource: DataSource;

  constructor(config: Configs) {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: config.db.dbHost, // Docker Compose service name
      port: config.db.dbPort ? parseInt(config.db.dbPort, 10) : 5432,
      username: config.db.dbUser,
      password: config.db.dbPassword,
      database: config.db.dbName,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : undefined,
      synchronize: process.env.NODE_ENV === 'development' ? true : false,
      logging: ['error', 'warn'],
      entities: [Transaction],

      /* Pooling options */
      extra: {
        max: 10, // maximum number of clients in the pool
        idleTimeoutMillis: 30000, // close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
      },
    });
  }

  public getDataSource(): DataSource {
    return this.dataSource;
  }

  // public getUserRepository(): Repository<User> {
  //   return this.dataSource.getRepository(User);
  // }

  public getPaymentRepository(): Repository<Transaction> {
    return this.dataSource.getRepository(Transaction);
  }

  public getSessionRepository(): Repository<Session> {
    return this.dataSource.getRepository(Session);
  }

  public async connect(): Promise<void> {
    try {
      await this.dataSource.initialize();
      console.log('✅ PostgreSQL connected successfully...');
    } catch (error: any) {
      console.error('❌ Error connecting to PostgreSQL:', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.dataSource.destroy();
      console.log('✅ PostgreSQL disconnected successfully...');
    } catch (error: any) {
      console.error('❌ Error disconnecting from PostgreSQL:', error.message);
    }
  }
}
