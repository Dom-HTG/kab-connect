import mongoose from 'mongoose';
import { Configs } from '../config/config';

export class MongoService {
  private uri: string;
  private dbName: string;

  constructor(config: Configs) {
    this.uri = config.db.connString;
    this.dbName = config.db.dbName;
  }

  public async connect(): Promise<void> {
    try {
      await mongoose.connect(this.uri, {
        dbName: this.dbName
      });
      console.log('✅ MongoDB connected successfully.');
    } catch (err: any) {
      console.error('❌ MongoDB connection error:', err.message);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('🛑 MongoDB disconnected.');
    } catch (err: any) {
      console.error('❌ Error during MongoDB disconnection:', err.message);
    }
  }
}
