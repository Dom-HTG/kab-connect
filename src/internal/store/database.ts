import { DataSource } from 'typeorm';
import { Configs } from '../../config/config';
import { User } from './userEntity';

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
      synchronize: true,
      logging: ['error', 'warn'],
      entities: [User],
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
