import path from 'path';
import { DataSource } from 'typeorm';
import { Configs } from '../config/config';
import { User } from './userEntity';

export class PostgresService {
  private dataSource: DataSource;

  constructor(config: Configs) {
    this.dataSource = new DataSource({
      type: 'postgres',
      url: config.db.connString,
      synchronize: false,
      logging: ['error', 'warn'],
      entities: [path.join(__dirname, '../store/userEntity.{ts,js}')],
    });
  }

  public get getRepository() {
    return this.dataSource.getRepository(User);
  }

  public async connect(): Promise<void> {
    try {
        await this.dataSource.initialize();
        console.log('✅ PostgreSQL connected successfully...');
    } catch (error: any) {
        console.error('❌ Error connecting to PostgreSQL:', error.message);
        process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
        await this.dataSource.destroy();
        console.log('✅ PostgreSQL disconnected successfully...');
    } catch (error: any) {
        console.error('❌ Error disconnecting from PostgreSQL:', error.message);
        process.exit(1);   
    }
  }
};
