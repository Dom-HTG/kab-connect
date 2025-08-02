// import { Pool } from 'pg';
// import { Configs } from '../config/config';

// export class PostgresService {
//   private pool: Pool;

//   constructor(config: Configs) {
//     this.pool = new Pool({
//       connectionString: config.db.connString,
//       database: config.db.dbName,
//     });
//   }

//   public async connect(): Promise<void> {
//     try {
//       await this.pool.connect();
//       console.log('✅ PostgreSQL connected successfully.');
//     } catch (err: any) {
//       console.error('❌ PostgreSQL connection error:', err.message);
//       process.exit(1);
//     }
//   }

//   public async disconnect(): Promise<void> {
//     try {
//       await this.pool.end();
//       console.log('🛑 PostgreSQL disconnected.');
//     } catch (err: any) {
//       console.error('❌ Error during PostgreSQL disconnection:', err.message);
//     }
//   }
// }
